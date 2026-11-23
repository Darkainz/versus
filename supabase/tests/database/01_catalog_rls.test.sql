begin;

select plan(4);

insert into public.products (
  id, code, slug, brand_slug, category_slug, name, tagline, visual_kind,
  release_date, is_active
)
values (
  '00000000-0000-4000-8000-000000000091',
  'testinactive',
  'test-inactive',
  'apple',
  'smartphones',
  'Produit de test inactif',
  'Fixture pgTAP',
  'phone',
  date '2026-01-01',
  false
);

set local role anon;

select is(
  (select count(*)::integer from public.products where code = 'testinactive'),
  0,
  'anon ne voit pas un produit inactif'
);

select is(
  (select count(*)::integer from public.catalog_products where code = 'testinactive'),
  0,
  'la vue security_invoker masque le produit inactif'
);

select throws_ok(
  $$insert into public.products (
    code, slug, brand_slug, category_slug, name, tagline, visual_kind, release_date
  ) values (
    'anonwrite', 'anon-write', 'apple', 'smartphones', 'Écriture interdite',
    'Fixture pgTAP', 'phone', date '2026-01-01'
  )$$,
  '42501',
  null,
  'anon ne peut pas écrire dans le catalogue'
);

reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

update public.products
set tagline = 'Modification client interdite'
where code = 'testinactive';

reset role;

select is(
  (select tagline from public.products where code = 'testinactive'),
  'Fixture pgTAP',
  'un client authentifié ne peut pas mettre à jour le catalogue'
);
select * from finish();
rollback;
