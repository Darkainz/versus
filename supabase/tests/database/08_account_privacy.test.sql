begin;

select plan(11);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000801',
    'authenticated',
    'authenticated',
    'privacy-owner@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Propriétaire export"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '00000000-0000-4000-8000-000000000802',
    'authenticated',
    'authenticated',
    'privacy-other@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Autre compte"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

create temporary table owned_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000801',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Propriétaire export","phone":"+22890123801","email":"privacy-owner@test.local"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Marché","instructions":"Porte bleue"}'::jsonb,
  'card',
  true
);
update public.orders
set user_id = '00000000-0000-4000-8000-000000000801'
where number = (select order_number from owned_order);

create temporary table other_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000802',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Autre compte","phone":"+22890123802","email":"privacy-other@test.local"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Bè","landmark":"École"}'::jsonb,
  'card',
  true
);
update public.orders
set user_id = '00000000-0000-4000-8000-000000000802'
where number = (select order_number from other_order);

insert into public.addresses (
  user_id, recipient_name, phone, zone_code, city, district, landmark, is_default
)
values (
  '00000000-0000-4000-8000-000000000801',
  'Propriétaire export',
  '+22890123801',
  'lome',
  'Lomé',
  'Tokoin',
  'Marché',
  true
);

insert into public.carts (user_id, items)
values (
  '00000000-0000-4000-8000-000000000801',
  '[{"sku":"AP5-BLA","qty":2}]'::jsonb
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000801',
  true
);
select pg_catalog.set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-000000000801","role":"authenticated"}',
  true
);
grant select on owned_order, other_order to authenticated;
set local role authenticated;

select is(
  public.export_my_data() -> 'profile' ->> 'full_name',
  'Propriétaire export',
  'l’export contient le profil du compte'
);

select is(
  pg_catalog.jsonb_array_length(public.export_my_data() -> 'addresses'),
  1,
  'l’export contient les adresses du compte'
);

select is(
  public.export_my_data() -> 'cart' -> 'items' -> 0 ->> 'sku',
  'AP5-BLA',
  'l’export contient le panier du compte'
);

select is(
  pg_catalog.jsonb_array_length(public.export_my_data() -> 'orders'),
  1,
  'l’export contient les commandes du compte'
);

select ok(
  not (
    public.export_my_data() -> 'orders'
  )::text like '%' || (select order_number from other_order) || '%',
  'l’export ne révèle pas les commandes d’un autre compte'
);

select ok(
  not public.export_my_data()::text like '%access_token_hash%',
  'l’export ne contient pas les hachages des jetons de commande'
);

select is(
  public.anonymize_my_account(),
  1,
  'l’anonymisation rapporte le nombre de commandes traitées'
);

reset role;

select is(
  (select orders.user_id from public.orders as orders where orders.number = (select order_number from owned_order)),
  null::uuid,
  'la commande est détachée du compte'
);

select ok(
  (select orders.anonymized_at is not null
   from public.orders as orders
   where orders.number = (select order_number from owned_order)),
  'la commande conserve la date d’anonymisation'
);

select is(
  (
    select pg_catalog.jsonb_build_array(
      orders.customer_name,
      orders.customer_phone,
      orders.customer_email,
      orders.city,
      orders.district,
      orders.landmark,
      orders.instructions
    )
    from public.orders as orders
    where orders.number = (select order_number from owned_order)
  ),
  '["Client supprimé","+22800000000",null,"Supprimée","Supprimé","Supprimé",null]'::jsonb,
  'les coordonnées personnelles sont effacées ou remplacées'
);

select is(
  (
    select count(*)::integer
    from public.order_items as items
    join public.orders as orders on orders.id = items.order_id
    where orders.number = (select order_number from owned_order)
  ),
  1,
  'les lignes commerciales de la commande sont conservées'
);

select * from finish();
rollback;
