begin;

select plan(18);

select ok(
  (select relrowsecurity
   from pg_catalog.pg_class as relations
   join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
   where namespaces.nspname = 'public'
     and relations.relname = 'addresses'),
  'RLS est activée sur les adresses'
);

select ok(
  (select relrowsecurity
   from pg_catalog.pg_class as relations
   join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
   where namespaces.nspname = 'public'
     and relations.relname = 'carts'),
  'RLS est activée sur les paniers de compte'
);

select ok(
  pg_catalog.has_table_privilege('authenticated', 'public.addresses', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.addresses', 'insert')
    and pg_catalog.has_table_privilege('authenticated', 'public.addresses', 'update')
    and pg_catalog.has_table_privilege('authenticated', 'public.addresses', 'delete'),
  'un client peut gérer ses adresses via les politiques RLS'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'public.addresses', 'select')
    and not pg_catalog.has_table_privilege('anon', 'public.addresses', 'insert'),
  'un visiteur anonyme ne peut pas accéder aux adresses'
);

select ok(
  pg_catalog.has_table_privilege('authenticated', 'public.carts', 'select')
    and pg_catalog.has_table_privilege('authenticated', 'public.carts', 'insert')
    and pg_catalog.has_table_privilege('authenticated', 'public.carts', 'update')
    and pg_catalog.has_table_privilege('authenticated', 'public.carts', 'delete'),
  'un client peut gérer son panier via les politiques RLS'
);

select ok(
  not pg_catalog.has_table_privilege('anon', 'public.carts', 'select')
    and not pg_catalog.has_table_privilege('anon', 'public.carts', 'insert'),
  'un visiteur anonyme ne peut pas accéder aux paniers de compte'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_index as indexes
    join pg_catalog.pg_class as relations on relations.oid = indexes.indrelid
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
    where namespaces.nspname = 'public'
      and relations.relname = 'addresses'
      and indexes.indisunique
      and indexes.indpred is not null
  ),
  'une seule adresse par compte peut être définie par défaut'
);

select throws_ok(
  $$
    insert into public.carts (user_id, items)
    values ('00000000-0000-4000-8000-000000000001',
      '[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]'::jsonb)
  $$,
  '23514',
  null,
  'un panier de compte ne peut pas dépasser vingt lignes'
);

select throws_ok(
  $$
    insert into public.addresses (
      user_id, recipient_name, phone, zone_code, city, district, landmark
    )
    values (
      '00000000-0000-4000-8000-000000000001',
      'Client Test',
      '123',
      'lome',
      'Lomé',
      'Tokoin',
      'Marché'
    )
  $$,
  '23514',
  null,
  'une adresse exige un numéro togolais valide'
);

select ok(
  not pg_catalog.has_column_privilege('anon', 'public.carts', 'items', 'select'),
  'le panier n’est pas lisible par anon'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000701',
    'authenticated',
    'authenticated',
    'address-owner@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Propriétaire adresse"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    'authenticated',
    'authenticated',
    'address-other@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Autre compte"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

select lives_ok(
  $$
    insert into public.carts (user_id, items)
    select
      '00000000-0000-4000-8000-000000000701',
      pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('sku', 'SKU-' || item, 'qty', 1))
    from pg_catalog.generate_series(1, 20) as item
  $$,
  'un panier de compte accepte vingt lignes'
);

insert into public.addresses (
  user_id, recipient_name, phone, zone_code, city, district, landmark
)
values
  (
    '00000000-0000-4000-8000-000000000701',
    'Propriétaire adresse',
    '+22890123456',
    'lome',
    'Lomé',
    'Tokoin',
    'Marché'
  ),
  (
    '00000000-0000-4000-8000-000000000702',
    'Autre compte',
    '+22890123457',
    'lome',
    'Lomé',
    'Tokoin',
    'École'
  );

update public.addresses
set is_default = true
where user_id = '00000000-0000-4000-8000-000000000701';

select throws_ok(
  $$
    insert into public.addresses (
      user_id, recipient_name, phone, zone_code, city, district, landmark, is_default
    )
    values (
      '00000000-0000-4000-8000-000000000701',
      'Deuxième défaut',
      '+22890123459',
      'lome',
      'Lomé',
      'Bè',
      'École',
      true
    )
  $$,
  '23505',
  null,
  'un compte ne peut définir qu’une seule adresse par défaut'
);

insert into public.carts (user_id, items)
values
  ('00000000-0000-4000-8000-000000000701', '[{"sku":"AP5-BLA","qty":1}]'::jsonb),
  ('00000000-0000-4000-8000-000000000702', '[{"sku":"SM-A57-BLK","qty":2}]'::jsonb)
on conflict (user_id) do update
set items = excluded.items;

set local role authenticated;
select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000701',
  true
);
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000701","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.addresses),
  1,
  'un compte ne voit que sa propre adresse'
);

select is(
  (
    select count(*)::integer
    from public.addresses
    where user_id = '00000000-0000-4000-8000-000000000702'
  ),
  0,
  'un compte ne peut pas lire les adresses d’un autre'
);

select is(
  (select count(*)::integer from public.carts),
  1,
  'un compte ne voit que son propre panier'
);

select is(
  (
    select count(*)::integer
    from public.carts
    where user_id = '00000000-0000-4000-8000-000000000702'
  ),
  0,
  'un compte ne peut pas lire le panier d’un autre'
);

select throws_ok(
  $$
    insert into public.addresses (
      user_id, recipient_name, phone, zone_code, city, district, landmark
    )
    values (
      '00000000-0000-4000-8000-000000000702',
      'Écriture interdite',
      '+22890123458',
      'lome',
      'Lomé',
      'Tokoin',
      'Marché'
    )
  $$,
  '42501',
  null,
  'un compte ne peut pas créer une adresse pour un autre'
);

with updated as (
  update public.carts
  set items = '[]'::jsonb
  where user_id = '00000000-0000-4000-8000-000000000702'
  returning 1
)
select is(
  (select count(*)::integer from updated),
  0,
  'un compte ne peut pas modifier le panier d’un autre'
);

reset role;

select * from finish();
rollback;
