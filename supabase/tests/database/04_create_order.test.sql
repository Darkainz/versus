begin;

select plan(40);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relations
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
    where namespaces.nspname = 'public'
      and relations.relname in (
        'orders',
        'order_items',
        'order_transitions',
        'order_status_history',
        'payment_attempts',
        'stock_movements'
      )
      and not relations.relrowsecurity
  ),
  'RLS est activée sur chaque table de commande'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'public.orders', 'select')
    and not pg_catalog.has_table_privilege('anon', 'public.orders', 'insert')
    and not pg_catalog.has_table_privilege('anon', 'public.orders', 'update')
    and not pg_catalog.has_table_privilege('anon', 'public.orders', 'delete'),
  'anon ne peut pas lire ni modifier les commandes directement'
);

select ok(
  pg_catalog.has_table_privilege('authenticated', 'public.orders', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.order_items', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.order_status_history', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.payment_attempts', 'select'),
  'authenticated a uniquement les droits de lecture nécessaires aux données de commande'
);

select ok(
  not pg_catalog.has_table_privilege('authenticated', 'public.orders', 'insert')
    and not pg_catalog.has_table_privilege('authenticated', 'public.orders', 'update')
    and not pg_catalog.has_table_privilege('authenticated', 'public.order_items', 'insert')
    and not pg_catalog.has_table_privilege('authenticated', 'public.order_status_history', 'insert')
    and not pg_catalog.has_table_privilege('authenticated', 'public.payment_attempts', 'insert'),
  'toutes les écritures de commande sont réservées aux RPC'
);

select ok(
  pg_catalog.has_table_privilege('anon', 'public.order_transitions', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.order_transitions', 'select')
    and not pg_catalog.has_table_privilege('anon', 'public.order_transitions', 'insert')
    and not pg_catalog.has_table_privilege('authenticated', 'public.order_transitions', 'insert'),
  'la matrice de transitions est lisible mais non modifiable par l’API'
);

select ok(
  not pg_catalog.has_sequence_privilege('anon', 'public.order_number_seq', 'usage')
    and not pg_catalog.has_sequence_privilege('anon', 'public.order_number_seq', 'select')
    and not pg_catalog.has_sequence_privilege('authenticated', 'public.order_number_seq', 'usage')
    and not pg_catalog.has_sequence_privilege('authenticated', 'public.order_number_seq', 'select'),
  'aucun rôle API ne peut consommer ni lire la séquence des commandes'
);

select ok(
  not pg_catalog.has_function_privilege(
    'anon',
    'private.next_order_number()',
    'execute'
  )
    and not pg_catalog.has_function_privilege(
      'authenticated',
      'private.next_order_number()',
      'execute'
    ),
  'la numérotation est réservée à la fonction interne'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'private.order_attempts', 'select')
    and not pg_catalog.has_table_privilege('authenticated', 'private.order_attempts', 'select')
    and not pg_catalog.has_table_privilege('anon', 'private.track_attempts', 'select')
    and not pg_catalog.has_table_privilege('authenticated', 'private.track_attempts', 'select'),
  'les tables de limitation de débit restent privées'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'public.stock_movements', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.stock_movements', 'select'),
  'seul le rôle authentifié peut lire les mouvements de stock'
);

select is(
  pg_catalog.format_type(columns.atttypid, columns.atttypmod),
  'bytea',
  'le jeton de commande est stocké sous forme d’empreinte binaire'
)
from pg_catalog.pg_attribute as columns
join pg_catalog.pg_class as relations on relations.oid = columns.attrelid
join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
where namespaces.nspname = 'public'
  and relations.relname = 'orders'
  and columns.attname = 'access_token_hash'
  and columns.attnum > 0
  and not columns.attisdropped;

select is(
  (select count(*)::integer from public.order_transitions),
  10,
  'la matrice contient exactement les transitions prévues'
);

select ok(
  exists (
    select 1
    from public.order_transitions
    where from_status = 'shipped'
      and to_status = 'delivered'
      and actor = 'admin'
  )
    and not exists (
      select 1
      from public.order_transitions
      where from_status = 'pending_payment'
        and to_status = 'delivered'
    ),
  'la matrice n’autorise pas à contourner les étapes de traitement'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_attribute as columns
    join pg_catalog.pg_class as relations on relations.oid = columns.attrelid
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
    where namespaces.nspname = 'public'
      and relations.relname = 'orders'
      and columns.attname = 'total_fcfa'
      and columns.attgenerated = 's'
      and columns.attnum > 0
      and not columns.attisdropped
  ),
  'le total est généré par la base à partir du sous-total et de la livraison'
);

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
  '00000000-0000-4000-8000-000000000099',
  'authenticated',
  'authenticated',
  'order-admin@test.local',
  '',
  pg_catalog.now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin de test"}'::jsonb,
  pg_catalog.now(),
  pg_catalog.now()
);

insert into public.user_roles (user_id, role)
values ('00000000-0000-4000-8000-000000000099', 'admin');

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000099',
  true
);
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}',
  true
);

select ok(private.is_admin(), 'le contexte de test est bien un administrateur');

select throws_ok(
  $$
    insert into public.order_transitions (from_status, to_status, actor)
    values ('pending_payment', 'delivered', 'admin')
  $$,
  '42501',
  null,
  'même un administrateur ne peut pas modifier la matrice via l’API'
);

reset role;
select pg_catalog.set_config('request.jwt.claim.sub', '', true);
select pg_catalog.set_config('request.jwt.claims', '{}', true);

select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.create_order(uuid,jsonb,jsonb,jsonb,public.payment_method,boolean)',
    'execute'
  )
    and pg_catalog.has_function_privilege(
      'authenticated',
      'public.create_order(uuid,jsonb,jsonb,jsonb,public.payment_method,boolean)',
      'execute'
    ),
  'la création est accessible à anon et authenticated uniquement via la RPC'
);

create temporary table created_card_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000201',
  '[{"sku":"AP5-BLA","qty":1,"price":1,"price_fcfa":1}]'::jsonb,
  '{"name":"Client Test","phone":"+22890123456","email":null}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché","instructions":null}'::jsonb,
  'card',
  true
);

select is(
  (select status::text from created_card_order),
  'pending_payment',
  'une commande par carte attend le paiement'
);

select is(
  (select payment_status::text from created_card_order),
  'pending',
  'une commande par carte commence avec le paiement en attente'
);

select is(
  (select orders.total_fcfa from public.orders as orders
   join created_card_order as result on result.order_number = orders.number),
  99500,
  'le total utilise le prix de la base et les frais de Lomé'
);

select is(
  (select items.unit_price_fcfa
   from public.order_items as items
   join created_card_order as result on result.order_number = (
     select orders.number from public.orders as orders where orders.id = items.order_id
   )),
  98000,
  'un prix injecté dans p_items est ignoré'
);

select ok(
  exists (
    select 1
    from created_card_order as result
    join public.orders as orders on orders.number = result.order_number
    where pg_catalog.char_length(result.access_token) = 64
      and orders.access_token_hash = extensions.digest(result.access_token, 'sha256')
  ),
  'seule l’empreinte SHA-256 du jeton invité est stockée'
);

select is(
  (select count(*)::integer
   from public.stock_movements as movements
   join public.orders as orders on orders.id = movements.order_id
   join created_card_order as result on result.order_number = orders.number
   where movements.reason = 'order' and movements.delta = -1),
  1,
  'la création écrit le mouvement de stock dans la même transaction'
);

create temporary table retried_card_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000201',
  '[]'::jsonb,
  '{}'::jsonb,
  '{}'::jsonb,
  'card',
  false
);

select is(
  (select order_number from retried_card_order),
  (select order_number from created_card_order),
  'une clé d’idempotence répétée renvoie la même commande'
);

select is(
  (select access_token from retried_card_order),
  null::text,
  'une reprise idempotente ne révèle pas une seconde fois le jeton'
);

select is(
  (select count(*)::integer
   from public.orders as orders
   where orders.idempotency_key = '00000000-0000-4000-8000-000000000201'),
  1,
  'une reprise idempotente ne crée pas une deuxième commande'
);

create temporary table created_cod_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000202',
  '[{"sku":"AP5-BLA","qty":4}]'::jsonb,
  '{"name":"Client COD","phone":"+22890123457"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Bè","landmark":"École"}'::jsonb,
  'cash_on_delivery',
  true
);

select is(
  (select status::text from created_cod_order),
  'confirmed',
  'une commande à la livraison est confirmée immédiatement'
);

select is(
  (select payment_status::text from created_cod_order),
  'cash_due',
  'une commande à la livraison attend l’encaissement'
);

select is(
  (select orders.total_fcfa from public.orders as orders
   join created_cod_order as result on result.order_number = orders.number),
  392000,
  'la livraison à Lomé est gratuite dès le seuil approuvé'
);

select is(
  (select count(*)::integer
   from public.stock_movements as movements
   join public.orders as orders on orders.id = movements.order_id
   join created_cod_order as result on result.order_number = orders.number
   where movements.reason = 'order' and movements.delta = -4),
  1,
  'le paiement à la livraison réserve le stock immédiatement'
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000203',
      '[{"sku":"IP18-ARG-256","qty":1}]'::jsonb,
      '{"name":"Client Test","phone":"+22890123459"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
      'cash_on_delivery',
      true
    )
  $$,
  'P0001',
  'VS_COD_CAP',
  'le paiement à la livraison refuse un panier au-dessus du plafond'
);

select is(
  (select count(*)::integer
   from private.order_attempts as attempts
   where attempts.phone = '+22890123459'),
  0,
  'une commande refusée pour plafond ne consomme pas la limite horaire'
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000204',
      '[{"sku":"IP18-BOR-256","qty":1}]'::jsonb,
      '{"name":"Client Test","phone":"+22890123460"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
      'card',
      true
    )
  $$,
  'P0001',
  'VS_OUT_OF_STOCK:IP18-BOR-256',
  'un stock insuffisant est refusé avec un message identifié'
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000205',
      '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
      '{"name":"Client Test","phone":"+22890123461"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
      'card',
      false
    )
  $$,
  'P0001',
  'VS_ACK_REQUIRED',
  'la confirmation du caractère fictif est obligatoire'
);

update public.shop_settings
set max_orders_per_phone_hour = 5
where id;

create temporary table first_phone_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000206',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

create temporary table second_phone_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000207',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

create temporary table third_phone_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000208',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

create temporary table fourth_phone_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000209',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

create temporary table fifth_phone_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000212',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

select is(
  (select count(*)::integer
   from private.order_attempts as attempts
   where attempts.phone = '+22890123462'),
  5,
  'les commandes réussies comptent dans la limite horaire par téléphone'
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000213',
      '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
      '{"name":"Client Limite","phone":"+22890123462"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
      'card',
      true
    )
  $$,
  'P0001',
  'VS_RATE_LIMITED',
  'la sixième commande horaire pour un téléphone est limitée'
);

select is(
  (select count(*)::integer
   from private.order_attempts as attempts
   where attempts.phone = '+22890123462'),
  5,
  'une commande limitée ne consomme pas une nouvelle tentative'
);

update public.shop_settings
set max_open_cod_per_phone = 2
where id;

create temporary table second_cod_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000214',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client COD","phone":"+22890123457"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Bè","landmark":"École"}'::jsonb,
  'cash_on_delivery',
  true
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000215',
      '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
      '{"name":"Client COD","phone":"+22890123457"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Bè","landmark":"École"}'::jsonb,
      'cash_on_delivery',
      true
    )
  $$,
  'P0001',
  'VS_RATE_LIMITED',
  'une troisième commande à la livraison ouverte pour le téléphone est limitée'
);

update public.shop_settings
set max_orders_per_hour = (
  select pg_catalog.count(*)::integer + 1
  from private.order_attempts as attempts
  where attempts.attempted_at >= pg_catalog.now() - interval '1 hour'
)
where id;

create temporary table last_global_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000210',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Client Global","phone":"+22890123463"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
  'card',
  true
);

select is(
  (select count(*)::integer
   from private.order_attempts as attempts
   where attempts.attempted_at >= pg_catalog.now() - interval '1 hour'),
  (select max_orders_per_hour::integer from public.shop_settings where id),
  'la limite globale inclut exactement les commandes réussies'
);

select throws_ok(
  $$
    select * from public.create_order(
      '00000000-0000-4000-8000-000000000211',
      '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
      '{"name":"Client Global","phone":"+22890123464"}'::jsonb,
      '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché"}'::jsonb,
      'card',
      true
    )
  $$,
  'P0001',
  'VS_RATE_LIMITED',
  'la limite globale horaire est appliquée malgré un téléphone différent'
);

select is(
  (select count(*)::integer
   from private.order_attempts as attempts
   where attempts.phone = '+22890123464'),
  0,
  'une tentative refusée par la limite globale ne réserve rien'
);

select * from finish();
rollback;
