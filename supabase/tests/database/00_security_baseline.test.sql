begin;

select plan(12);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relations
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = relations.relnamespace
    where namespaces.nspname = 'public'
      and relations.relkind in ('r', 'p')
      and not relations.relrowsecurity
  ),
  'RLS est activée sur chaque table publique'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as procedures
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = procedures.pronamespace
    where namespaces.nspname in ('public', 'private')
      and procedures.prosecdef
      and not coalesce(procedures.proconfig, array[]::text[]) @> array['search_path=""']
  ),
  'chaque fonction security definer fixe search_path'
);

select is_empty(
  $$
    with allowed(fn, rolname) as (
      values
        ('is_admin', 'anon'),
        ('is_admin', 'authenticated'),
        ('ping', 'anon'),
        ('quote_cart', 'anon'),
        ('quote_cart', 'authenticated')
    )
    select namespaces.nspname || '.' || procedures.proname, roles.rolname
    from pg_catalog.pg_proc as procedures
    join pg_catalog.pg_namespace as namespaces on namespaces.oid = procedures.pronamespace
    cross join (values ('anon'), ('authenticated')) as roles(rolname)
    where namespaces.nspname in ('public', 'private')
      and not exists (
        select 1
        from pg_catalog.pg_depend as dependencies
        where dependencies.objid = procedures.oid
          and dependencies.deptype = 'e'
      )
      and pg_catalog.has_function_privilege(roles.rolname, procedures.oid, 'execute')
      and (procedures.proname, roles.rolname) not in (select fn, rolname from allowed)
  $$,
  'anon et authenticated ne peuvent exécuter que les fonctions autorisées'
);

select ok(
  pg_catalog.has_table_privilege('anon', 'public.catalog_products', 'select'),
  'anon peut lire la vue catalogue'
);
select ok(
  not pg_catalog.has_table_privilege('anon', 'public.catalog_products', 'insert'),
  'anon ne peut pas insérer dans la vue catalogue'
);
select ok(
  not pg_catalog.has_table_privilege('anon', 'public.catalog_products', 'update'),
  'anon ne peut pas modifier la vue catalogue'
);
select ok(
  not pg_catalog.has_table_privilege('anon', 'public.catalog_products', 'delete'),
  'anon ne peut pas supprimer dans la vue catalogue'
);
select ok(
  pg_catalog.has_function_privilege('anon', 'public.ping()', 'execute'),
  'anon peut appeler ping'
);
select ok(
  not pg_catalog.has_function_privilege('authenticated', 'public.ping()', 'execute'),
  'ping n’est pas accordée à authenticated'
);
select ok(
  pg_catalog.has_function_privilege('anon', 'public.quote_cart(jsonb,text)', 'execute'),
  'anon peut obtenir un devis calculé en base'
);
select ok(
  pg_catalog.has_function_privilege('authenticated', 'public.quote_cart(jsonb,text)', 'execute'),
  'authenticated peut obtenir un devis calculé en base'
);
select ok(
  not pg_catalog.has_column_privilege(
    'authenticated',
    'public.product_variants',
    'stock',
    'update'
  ),
  'le stock des variantes n’est pas modifiable directement'
);

select * from finish();
rollback;
