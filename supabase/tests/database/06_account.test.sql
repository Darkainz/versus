begin;

select plan(10);

create temporary table guest_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000601',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Compte","phone":"+22890123501"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000611', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000611',
  'authenticated',
  'authenticated',
  'client-compte@example.test',
  '',
  pg_catalog.now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Client Compte"}'::jsonb,
  pg_catalog.now(),
  pg_catalog.now()
);

select ok(
  public.claim_guest_order(
    (select order_number from guest_order),
    (select access_token from guest_order)
  ),
  'le jeton de commande permet de rattacher une commande invitée'
);

select is(
  (select orders.user_id::text
   from public.orders as orders
   where orders.number = (select order_number from guest_order)),
  '00000000-0000-4000-8000-000000000611',
  'la commande est rattachée au compte authentifié'
);

select ok(
  public.claim_guest_order(
    (select order_number from guest_order),
    (select access_token from guest_order)
  ),
  'le rattachement au même compte est idempotent'
);

select is(
  public.get_order_for_viewer(
    (select order_number from guest_order),
    ''
  ) ->> 'number',
  (select order_number from guest_order),
  'le propriétaire authentifié peut consulter sa commande sans jeton invité'
);

select is(
  (
    select count(*)::integer
    from public.start_payment(
      (select order_number from guest_order),
      '',
      'tmoney',
      '+22890123456'
    )
  ),
  1,
  'le propriétaire authentifié peut relancer un paiement sans jeton invité'
);

select throws_ok(
  $$
    select public.claim_guest_order(
      (select order_number from guest_order),
      'faux-jeton'
    )
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'un jeton incorrect ne permet pas de revendiquer une commande'
);

create temporary table owned_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000602',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Compte","phone":"+22890123502"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

select ok(
  public.cancel_my_order((select order_number from owned_order)),
  'le propriétaire peut annuler une commande en attente'
);

select is(
  (select orders.status::text
   from public.orders as orders
   where orders.number = (select order_number from owned_order)),
  'cancelled',
  'la commande annulée passe à cancelled'
);

select is(
  (select variants.stock
   from public.product_variants as variants
   where variants.sku = 'AP5-BLA'),
  23,
  'l’annulation restitue le stock réservé'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000612', true);

select throws_ok(
  $$
    select public.cancel_my_order((select order_number from guest_order))
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'un compte ne peut pas annuler une commande appartenant à un autre compte'
);

select * from finish();
rollback;
