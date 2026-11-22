begin;

select plan(4);

insert into public.products (
  id, code, slug, brand_slug, category_slug, name, tagline, visual_kind,
  release_date, is_active
)
values
  (
    '00000000-0000-4000-8000-000000000092',
    'testnoimage',
    'test-no-image',
    'apple',
    'smartphones',
    'Produit sans image',
    'Fixture pgTAP',
    'phone',
    date '2026-01-01',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000093',
    'novariant',
    'test-no-variant',
    'apple',
    'smartphones',
    'Produit sans variante',
    'Fixture pgTAP',
    'phone',
    date '2026-01-01',
    false
  ),
  (
    '00000000-0000-4000-8000-000000000094',
    'badstorage',
    'test-bad-storage',
    'apple',
    'smartphones',
    'Produit stockage invalide',
    'Fixture pgTAP',
    'phone',
    date '2026-01-01',
    false
  );

insert into public.product_variants (
  product_id, sku, color_name, color_slug, storage_gb, price_fcfa, is_default
)
values (
  '00000000-0000-4000-8000-000000000092',
  'TEST-NO-IMAGE',
  'Noir',
  'noir',
  128,
  1000,
  true
);

insert into public.product_images (
  product_id, src, width, height, alt, is_primary
)
values (
  '00000000-0000-4000-8000-000000000093',
  '/products/test.png',
  1,
  1,
  'Image de test',
  true
);

select throws_ok(
  $$update public.products set is_active = true
    where id = '00000000-0000-4000-8000-000000000092'$$,
  '23514',
  null,
  'un produit sans image principale ne peut pas être activé'
);

select throws_ok(
  $$update public.products set is_active = true
    where id = '00000000-0000-4000-8000-000000000093'$$,
  '23514',
  null,
  'un produit sans variante par défaut ne peut pas être activé'
);

select throws_ok(
  $$insert into public.product_variants (
    product_id, sku, color_name, color_slug, storage_gb, price_fcfa
  ) values (
    '00000000-0000-4000-8000-000000000094',
    'TEST-BAD-STORAGE',
    'Noir',
    'noir',
    null,
    1000
  )$$,
  '23514',
  null,
  'un smartphone doit préciser son stockage'
);

select ok(
  pg_catalog.to_regprocedure('public.set_updated_at()') is null,
  'la fonction de trigger n’est pas exposée dans public'
);

select * from finish();
rollback;
