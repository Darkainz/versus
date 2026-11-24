begin;

select plan(41);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000901',
    'authenticated',
    'authenticated',
    'admin-versus@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin VERSUS"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  ),
  (
    '00000000-0000-4000-8000-000000000902',
    'authenticated',
    'authenticated',
    'client-versus@test.local',
    '',
    pg_catalog.now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Client VERSUS"}'::jsonb,
    pg_catalog.now(),
    pg_catalog.now()
  );

insert into public.user_roles (user_id, role)
values ('00000000-0000-4000-8000-000000000901', 'admin');

create temporary table admin_settings_fixture as
select
  (
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'code', zones.code,
        'fee_fcfa', zones.fee_fcfa + case when zones.code = 'lome' then 1 else 0 end,
        'free_from_fcfa', zones.free_from_fcfa,
        'eta_label', zones.eta_label
      )
      order by zones.position
    )
    from public.delivery_zones as zones
  ) as zones,
  (
    select pg_catalog.jsonb_build_object(
      'banner_text', settings.banner_text,
      'cod_max_fcfa', settings.cod_max_fcfa,
      'payment_ttl_minutes', settings.payment_ttl_minutes,
      'attempt_ttl_seconds', settings.attempt_ttl_seconds,
      'max_qty_per_line', case
        when settings.max_qty_per_line = 5 then 4
        else settings.max_qty_per_line + 1
      end,
      'max_orders_per_phone_hour', settings.max_orders_per_phone_hour,
      'max_open_cod_per_phone', settings.max_open_cod_per_phone,
      'max_orders_per_hour', settings.max_orders_per_hour
    )
    from public.shop_settings as settings
    where settings.id = true
  ) as settings,
  (
    select zones.fee_fcfa
    from public.delivery_zones as zones
    where zones.code = 'lome'
  ) as original_lome_fee,
  (
    select case
      when settings.max_qty_per_line = 5 then 4
      else settings.max_qty_per_line + 1
    end
    from public.shop_settings as settings
    where settings.id = true
  ) as updated_max_qty;

insert into public.product_variants (
  product_id,
  sku,
  color_name,
  color_slug,
  color_hex,
  storage_gb,
  price_fcfa,
  stock,
  low_stock_threshold,
  is_default,
  is_active
)
values (
  (select id from public.products where code = 'ap5'),
  'ADMIN-EDIT-TEST',
  'Bleu test',
  'bleu-test',
  '#112233',
  null,
  100000,
  7,
  2,
  false,
  true
);

insert into public.products (
  id,
  code,
  slug,
  brand_slug,
  category_slug,
  name,
  tagline,
  description,
  visual_kind,
  release_date,
  is_active
)
values (
  '00000000-0000-4000-8000-000000000906',
  'imgtest',
  'admin-image-test',
  'apple',
  'ecouteurs',
  'Produit images test',
  'Produit temporaire.',
  'Fixture pgTAP.',
  'buds',
  '2026-01-01',
  false
);

insert into public.product_images (
  id,
  product_id,
  src,
  width,
  height,
  alt,
  is_primary
)
values
  (
    '00000000-0000-4000-8000-000000000907',
    '00000000-0000-4000-8000-000000000906',
    'https://example.test/admin-image-first.webp',
    100,
    100,
    'Première image test',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000908',
    '00000000-0000-4000-8000-000000000906',
    'https://example.test/admin-image-second.webp',
    100,
    100,
    'Seconde image test',
    false
  );

create temporary table admin_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000903',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Commande Admin","phone":"+22890123901","email":"admin-order@test.local"}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Test"}'::jsonb,
  'card',
  true
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000902',
  true
);
select pg_catalog.set_config(
  'request.jwt.claim.role',
  'authenticated',
  true
);

select throws_ok(
  $$
    select public.admin_dashboard_stats();
  $$,
  'P0001',
  'VS_FORBIDDEN',
  'un client ne peut pas lire les statistiques admin'
);

select throws_ok(
  $$
    select public.admin_adjust_stock(
      (select id from public.product_variants where sku = 'AP5-BLA'),
      1,
      'restock',
      'Test client'
    );
  $$,
  'P0001',
  'VS_FORBIDDEN',
  'un client ne peut pas ajuster le stock'
);

select throws_ok(
  $$
    select public.admin_save_delivery_settings(
      (select zones from admin_settings_fixture),
      (select settings from admin_settings_fixture)
    );
  $$,
  'P0001',
  'VS_FORBIDDEN',
  'un client ne peut pas modifier les réglages de livraison'
);

select throws_ok(
  $$
    select public.admin_update_product_variant(
      (select id from public.product_variants where sku = 'ADMIN-EDIT-TEST'),
      (select id from public.products where code = 'ap5'),
      'ADMIN-EDIT-TEST',
      'Bleu test',
      'bleu-test',
      100000,
      2::smallint,
      false,
      true,
      '#112233',
      null,
      null
    );
  $$,
  'P0001',
  'VS_FORBIDDEN',
  'un client ne peut pas modifier une variante'
);

select throws_ok(
  $$
    select public.admin_set_product_image_primary(
      '00000000-0000-4000-8000-000000000908',
      '00000000-0000-4000-8000-000000000906'
    );
  $$,
  'P0001',
  'VS_FORBIDDEN',
  'un client ne peut pas choisir l’image principale'
);

select pg_catalog.set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000901',
  true
);

select is(
  public.admin_save_delivery_settings(
    (select zones from admin_settings_fixture),
    (select settings from admin_settings_fixture)
  ),
  true,
  'l’administrateur enregistre les zones et réglages par une RPC'
);

select throws_ok(
  $$
    select public.admin_update_product_variant(
      (select id from public.product_variants where sku = 'ADMIN-EDIT-TEST'),
      (select id from public.products where code = 'ap5'),
      'ADMIN-EDIT-TEST',
      'Bleu test',
      'bleu-test',
      100000,
      2::smallint,
      true,
      false,
      '#112233',
      null,
      null
    );
  $$,
  'P0001',
  'VS_INVALID',
  'une variante inactive ne peut pas devenir le défaut d’un produit actif'
);

select is(
  public.admin_update_product_variant(
    (select id from public.product_variants where sku = 'ADMIN-EDIT-TEST'),
    (select id from public.products where code = 'ap5'),
    'ADMIN-EDITED',
    'Bleu modifie',
    'bleu-modifie',
    125000,
    4::smallint,
    true,
    true,
    '#223344',
    null,
    null
  ),
  true,
  'l’administrateur modifie une variante via la RPC'
);

select ok(
  exists (
    select 1
    from public.product_variants
    where sku = 'ADMIN-EDITED'
      and color_name = 'Bleu modifie'
      and color_slug = 'bleu-modifie'
      and color_hex = '#223344'
      and storage_gb is null
      and price_fcfa = 125000
      and low_stock_threshold = 4
      and is_active
  ),
  'les champs de variante autorisés sont modifiés'
);

select ok(
  not (select is_default from public.product_variants where sku = 'AP5-BLA'),
  'la RPC libère l’ancienne variante par défaut'
);

select ok(
  (select is_default from public.product_variants where sku = 'ADMIN-EDITED'),
  'la RPC attribue le défaut à la variante modifiée'
);

select is(
  (select stock from public.product_variants where sku = 'ADMIN-EDITED'),
  7,
  'la modification préserve le stock'
);

select throws_ok(
  $$
    select public.admin_update_product_variant(
      (select id from public.product_variants where sku = 'ADMIN-EDITED'),
      (select id from public.products where code = 'ap5'),
      'ADMIN-EDITED',
      'Bleu modifie',
      'bleu-modifie',
      125000,
      4::smallint,
      false,
      true,
      '#223344',
      null,
      null
    );
  $$,
  'P0001',
  'VS_INVALID',
  'un produit actif ne peut pas perdre sa variante par défaut active'
);

select throws_ok(
  $$
    select public.admin_update_product_variant(
      (select id from public.product_variants where sku = 'ADMIN-EDITED'),
      (select id from public.products where code <> 'ap5' order by code limit 1),
      'ADMIN-EDITED',
      'Bleu modifie',
      'bleu-modifie',
      125000,
      4::smallint,
      true,
      true,
      '#223344',
      null,
      null
    );
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'la RPC refuse une variante qui n’appartient pas au produit indiqué'
);

select is(
  public.admin_set_product_image_primary(
    '00000000-0000-4000-8000-000000000908',
    '00000000-0000-4000-8000-000000000906'
  ),
  true,
  'l’administrateur désigne une image principale via la RPC'
);

select ok(
  not (
    select is_primary
    from public.product_images
    where id = '00000000-0000-4000-8000-000000000907'
  ),
  'le changement libère l’ancienne image principale'
);

select ok(
  (
    select is_primary
    from public.product_images
    where id = '00000000-0000-4000-8000-000000000908'
  ),
  'le changement désigne la nouvelle image principale'
);

select throws_ok(
  $$
    select public.admin_set_product_image_primary(
      '00000000-0000-4000-8000-000000000908',
      (select id from public.products where code = 'ap5')
    );
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'la RPC refuse une image qui n’appartient pas au produit indiqué'
);

select is(
  (
    select fee_fcfa
    from public.delivery_zones
    where code = 'lome'
  ),
  (select original_lome_fee + 1 from admin_settings_fixture),
  'la RPC enregistre les frais de livraison'
);

select is(
  (
    select max_qty_per_line::integer
    from public.shop_settings
    where id = true
  ),
  (select updated_max_qty::integer from admin_settings_fixture),
  'la RPC enregistre la quantité maximale par ligne'
);

select throws_ok(
  $$
    select public.admin_save_delivery_settings(
      (
        select pg_catalog.jsonb_agg(
          case
            when item.zone ->> 'code' = 'lome'
              then pg_catalog.jsonb_set(item.zone, '{fee_fcfa}', '-1'::jsonb)
            else item.zone
          end
          order by item.ordinality
        )
        from pg_catalog.jsonb_array_elements(
          (select zones from admin_settings_fixture)
        ) with ordinality as item(zone, ordinality)
      ),
      (select settings from admin_settings_fixture)
    );
  $$,
  'P0001',
  'VS_INVALID',
  'la RPC refuse une valeur invalide avant toute écriture'
);

select is(
  (
    select fee_fcfa
    from public.delivery_zones
    where code = 'lome'
  ),
  (select original_lome_fee + 1 from admin_settings_fixture),
  'une entrée invalide ne modifie aucun réglage déjà enregistré'
);

create temporary table admin_savanes_snapshot as
select *
from public.delivery_zones
where code = 'savanes';

delete from public.delivery_zones
where code = 'savanes';

select throws_ok(
  $$
    select public.admin_save_delivery_settings(
      (
        select pg_catalog.jsonb_agg(
          case
            when item.zone ->> 'code' = 'lome'
              then pg_catalog.jsonb_set(
                item.zone,
                '{fee_fcfa}',
                pg_catalog.to_jsonb((item.zone ->> 'fee_fcfa')::integer + 1)
              )
            else item.zone
          end
          order by item.ordinality
        )
        from pg_catalog.jsonb_array_elements(
          (select zones from admin_settings_fixture)
        ) with ordinality as item(zone, ordinality)
      ),
      (select settings from admin_settings_fixture)
    );
  $$,
  'P0001',
  'VS_NOT_FOUND',
  'l’absence d’une zone annule toute la transaction de réglages'
);

select is(
  (
    select fee_fcfa
    from public.delivery_zones
    where code = 'lome'
  ),
  (select original_lome_fee + 1 from admin_settings_fixture),
  'une mise à jour partielle des zones est annulée'
);

insert into public.delivery_zones (
  code,
  label,
  fee_fcfa,
  free_from_fcfa,
  eta_label,
  eta_min_days,
  eta_max_days,
  is_active,
  position
)
select
  code,
  label,
  fee_fcfa,
  free_from_fcfa,
  eta_label,
  eta_min_days,
  eta_max_days,
  is_active,
  position
from admin_savanes_snapshot;

select is(
  public.admin_adjust_stock(
    (select id from public.product_variants where sku = 'AP5-BLA'),
    1,
    'restock',
    'Test admin'
  ),
  24,
  'l’administrateur ajuste le stock via la RPC'
);

select is(
  (
    select delta
    from public.stock_movements
    where variant_id = (select id from public.product_variants where sku = 'AP5-BLA')
    order by created_at desc, id desc
    limit 1
  ),
  1,
  'chaque ajustement écrit un mouvement'
);

select throws_ok(
  $$
    select public.admin_adjust_stock(
      (select id from public.product_variants where sku = 'AP5-BLA'),
      -100000,
      'damage',
      'Test négatif'
    );
  $$,
  'P0001',
  'VS_INVALID',
  'un ajustement ne peut pas rendre le stock négatif'
);

select ok(
  public.admin_set_order_status(
    (select id from public.orders where number = (select order_number from admin_order)),
    'cancelled',
    'Test admin',
    false
  ),
  'l’administrateur peut annuler une commande autorisée'
);

select is(
  (
    select status::text
    from public.orders
    where number = (select order_number from admin_order)
  ),
  'cancelled',
  'l’annulation admin change le statut'
);

select is(
  (
    select count(*)::integer
    from public.order_status_history
    where order_id = (select id from public.orders where number = (select order_number from admin_order))
      and actor = 'admin'
  ),
  1,
  'la transition admin est historisée'
);

select throws_ok(
  $$
    select public.admin_set_order_status(
      (select id from public.orders where number = (select order_number from admin_order)),
      'preparing',
      'Transition impossible',
      false
    );
  $$,
  'P0001',
  'VS_NOT_TRANSITION',
  'une commande annulée ne peut pas revenir en préparation'
);

create temporary table admin_cod_order as
select *
from public.create_order(
  '00000000-0000-4000-8000-000000000904',
  '[{"sku":"AP5-BLA","qty":1}]'::jsonb,
  '{"name":"Commande COD Admin","phone":"+22890123904","email":null}'::jsonb,
  '{"zone_code":"lome","city":"Lomé","district":"Tokoin","landmark":"Test"}'::jsonb,
  'cash_on_delivery',
  true
);

select throws_ok(
  $$
    select public.admin_set_order_status(
      (
        select id
        from public.orders
        where number = (select order_number from admin_cod_order)
      ),
      'delivered',
      'Transition directe invalide',
      true
    );
  $$,
  'P0001',
  'VS_NOT_TRANSITION',
  'une commande confirmée ne peut pas passer directement en livraison'
);

select ok(
  (public.admin_dashboard_stats() -> 'latest_orders')::jsonb is not null,
  'le tableau de bord admin retourne ses indicateurs'
);

set local role authenticated;

select throws_ok(
  $$
    update public.product_variants
    set stock = 100
    where sku = 'AP5-BLA'
  $$,
  '42501',
  null,
  'même l’administrateur ne peut pas modifier directement stock'
);

select throws_ok(
  $$
    insert into public.product_variants (
      product_id, sku, color_name, color_slug, price_fcfa, stock
    )
    values (
      (select id from public.products where code = 'ap5'),
      'TEST-BLC',
      'Test',
      'test',
      1000,
      100
    )
  $$,
  '42501',
  null,
  'même l’administrateur ne peut pas initialiser stock à l’insertion'
);

select throws_ok(
  $$
    insert into public.order_transitions (from_status, to_status, actor)
    values ('pending_payment', 'confirmed', 'admin')
  $$,
  '42501',
  null,
  'même l’administrateur ne peut pas ajouter une transition'
);

select throws_ok(
  $$
    update public.order_transitions
    set to_status = 'cancelled'
    where from_status = 'shipped' and to_status = 'delivered' and actor = 'admin'
  $$,
  '42501',
  null,
  'même l’administrateur ne peut pas modifier la matrice de transitions'
);

select throws_ok(
  $$
    delete from public.order_transitions
    where from_status = 'shipped' and to_status = 'delivered' and actor = 'admin'
  $$,
  '42501',
  null,
  'même l’administrateur ne peut pas supprimer une transition'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_admin_insert'
  ),
  'la politique Storage refuse les uploads hors admin'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_admin_delete'
  ),
  'la politique Storage limite la suppression au bucket admin'
);

select ok(
  exists (
    select 1
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'product_images_admin_select'
  ),
  'la politique Storage permet à l’admin de lire les métadonnées des images'
);

select * from finish();
rollback;
