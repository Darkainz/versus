begin;

select plan(28);

create temporary table payment_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000301',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Paiement","phone":"+22890123470","email":"client@example.test"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

select is(
  public.get_order_for_viewer((select order_number from payment_order)),
  null::jsonb,
  'un invité sans jeton ne peut pas consulter la commande'
);

select ok(
  pg_catalog.jsonb_typeof(public.get_order_for_viewer(
    (select order_number from payment_order),
    (select access_token from payment_order)
  )) = 'object',
  'le jeton correct autorise la consultation'
);

select ok(
  not (
    public.get_order_for_viewer(
      (select order_number from payment_order),
      (select access_token from payment_order)
    ) ? 'access_token_hash'
  ),
  'le lecteur n’expose jamais l’empreinte du jeton'
);

select throws_ok(
  $$
    select * from public.start_payment(
      (select order_number from payment_order),
      'faux-jeton',
      'tmoney',
      '+22890123470'
    )
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'un jeton incorrect ne peut pas démarrer un paiement'
);

create temporary table first_attempt as
select *
from public.start_payment(
  (select order_number from payment_order),
  (select access_token from payment_order),
  'tmoney',
  '+22890123470'
);

select ok(
  (select reference ~ '^SIM-TM-[A-Z0-9]{6}$' from first_attempt),
  'T-Money reçoit une référence simulée au format prévu'
);

select is(
  (select attempts.msisdn_masked
   from public.payment_attempts as attempts
   where attempts.reference = (select reference from first_attempt)),
  '+228 90 •• •• 70',
  'le numéro mobile est masqué en base'
);

select is(
  (select orders.payment_method::text
   from public.orders as orders
   where orders.number = (select order_number from payment_order)),
  'tmoney',
  'la méthode choisie est enregistrée sur la commande'
);

create temporary table second_attempt as
select *
from public.start_payment(
  (select order_number from payment_order),
  (select access_token from payment_order),
  'flooz',
  '+22890123470'
);

select is(
  (select attempts.outcome::text
   from public.payment_attempts as attempts
   where attempts.reference = (select reference from first_attempt)),
  'expired',
  'le démarrage d’un autre moyen expire la tentative précédente'
);

select ok(
  (select reference ~ '^SIM-FL-[A-Z0-9]{6}$' from second_attempt),
  'Flooz reçoit une référence avec son préfixe propre'
);

select is(
  public.resolve_payment(
    (select order_number from payment_order),
    (select access_token from payment_order),
    (select reference from second_attempt),
    'failed'
  ),
  true,
  'un refus simulé est enregistré'
);

select ok(
  exists (
    select 1
    from public.orders as orders
    join payment_order as created on created.order_number = orders.number
    where orders.status = 'pending_payment'
      and orders.payment_status = 'failed'
  ),
  'un refus laisse la commande en attente de paiement'
);

create temporary table retry_attempt as
select *
from public.start_payment(
  (select order_number from payment_order),
  (select access_token from payment_order),
  'card',
  null
);

select is(
  (select attempts.outcome::text
   from public.payment_attempts as attempts
   where attempts.reference = (select reference from retry_attempt)),
  'pending',
  'une nouvelle tentative est créée après un refus'
);

select is(
  public.resolve_payment(
    (select order_number from payment_order),
    (select access_token from payment_order),
    (select reference from retry_attempt),
    'succeeded'
  ),
  true,
  'la validation simulée est enregistrée'
);

select ok(
  exists (
    select 1
    from public.orders as orders
    join payment_order as created on created.order_number = orders.number
    where orders.status = 'confirmed'
      and orders.payment_status = 'succeeded'
      and orders.payment_deadline is null
  ),
  'un paiement réussi confirme la commande'
);

select is(
  (public.get_order_for_viewer(
    (select order_number from payment_order),
    (select access_token from payment_order)
  ) -> 'history' -> -1 ->> 'to_status'),
  'confirmed',
  'la confirmation est ajoutée à l’historique'
);

create temporary table cod_conversion_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000302',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client COD","phone":"+22890123471"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Bè","landmark":"École"}'::jsonb,
  'card',
  true
);

select is(
  (select count(*)::integer
   from public.start_payment(
     (select order_number from cod_conversion_order),
     (select access_token from cod_conversion_order),
     'cash_on_delivery',
     null
   )),
  0,
  'le passage au paiement à la livraison ne crée pas de tentative mobile'
);

select ok(
  exists (
    select 1
    from public.orders as orders
    join cod_conversion_order as created on created.order_number = orders.number
    where orders.status = 'confirmed'
      and orders.payment_method = 'cash_on_delivery'
      and orders.payment_status = 'cash_due'
      and orders.payment_deadline is null
  ),
  'le paiement à la livraison confirme la commande sans encaissement'
);

select throws_ok(
  $$
    select * from public.start_payment(
      (select order_number from payment_order),
      (select access_token from payment_order),
      'tmoney',
      null
    )
  $$,
  'P0001',
  'VS_NOT_PAYABLE',
  'une commande confirmée ne peut pas démarrer un nouveau paiement'
);

select is(
  public.track_order(
    (select order_number from cod_conversion_order),
    '+22800000000'
  ),
  null::jsonb,
  'un mauvais téléphone ne révèle pas la commande'
);

select is(
  public.track_order('VS-2026-999998', '+22890123471'),
  null::jsonb,
  'un numéro inconnu renvoie la même absence de résultat'
);

select ok(
  public.track_order(
    (select order_number from cod_conversion_order),
    '+22890123471'
  ) ?& array['number', 'status', 'payment_status', 'city', 'items', 'history']
    and not (
      public.track_order(
        (select order_number from cod_conversion_order),
        '+22890123471'
      ) ?| array['customer_phone', 'customer_email', 'district', 'landmark', 'instructions']
    ),
  'le suivi expose la ville et la frise sans adresse ni coordonnées personnelles'
);

do $$
begin
  for attempt in 1..10 loop
    perform public.track_order('VS-2026-999999', '+22890123472');
  end loop;
end;
$$;

select throws_ok(
  $$select public.track_order('VS-2026-999999', '+22890123472')$$,
  'P0001',
  'VS_RATE_LIMITED',
  'la onzième tentative de suivi dans l’heure est limitée'
);

select is(
  (select count(*)::integer
   from private.track_attempts as attempts
   where attempts.order_number = 'VS-2026-999999'),
  10,
  'une tentative limitée ne crée pas d’entrée supplémentaire'
);

create temporary table expiring_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000303',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Expiration","phone":"+22890123473"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

create temporary table expiring_attempt as
select *
from public.start_payment(
  (select order_number from expiring_order),
  (select access_token from expiring_order),
  'tmoney',
  '+22890123473'
);

update public.orders as orders
set payment_deadline = pg_catalog.now() - interval '1 minute'
from expiring_order as created
where orders.number = created.order_number;

select is(
  (public.get_order_for_viewer(
    (select order_number from expiring_order),
    (select access_token from expiring_order)
  ) ->> 'status'),
  'cancelled',
  'la lecture annule paresseusement une commande dont le paiement a expiré'
);

select ok(
  exists (
    select 1
    from public.orders as orders
    join expiring_order as created on created.order_number = orders.number
    join public.payment_attempts as attempts on attempts.order_id = orders.id
    where orders.payment_status = 'expired'
      and attempts.reference = (select reference from expiring_attempt)
      and attempts.outcome = 'expired'
  )
    and exists (
      select 1
      from public.stock_movements as movements
      join public.orders as orders on orders.id = movements.order_id
      join expiring_order as created on created.order_number = orders.number
      where movements.reason = 'order_cancelled'
        and movements.delta = 1
    ),
  'l’expiration clôt la tentative et libère le stock une seule fois'
);

select is(
  public.expire_overdue_orders(),
  0,
  'la tâche d’expiration ne reprend pas une commande déjà annulée'
);

create temporary table scheduled_expiring_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000304',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Cron","phone":"+22890123474"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

update public.orders as orders
set payment_deadline = pg_catalog.now() - interval '1 minute'
from scheduled_expiring_order as created
where orders.number = created.order_number;

select is(
  public.expire_overdue_orders(),
  1,
  'la tâche expire une commande arrivée à échéance'
);

select ok(
  exists (
    select 1
    from public.orders as orders
    join scheduled_expiring_order as created on created.order_number = orders.number
    join public.stock_movements as movements on movements.order_id = orders.id
    where orders.status = 'cancelled'
      and orders.payment_status = 'expired'
      and movements.reason = 'order_cancelled'
      and movements.delta = 1
  ),
  'la tâche marque le paiement expiré et libère le stock'
);

select * from finish();
rollback;
