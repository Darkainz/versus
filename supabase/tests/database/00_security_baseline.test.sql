begin;

select plan(19);

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
        ('quote_cart', 'authenticated'),
        ('create_order', 'anon'),
        ('create_order', 'authenticated'),
        ('get_order_for_viewer', 'anon'),
        ('get_order_for_viewer', 'authenticated'),
        ('start_payment', 'anon'),
        ('start_payment', 'authenticated'),
        ('resolve_payment', 'anon'),
        ('resolve_payment', 'authenticated'),
        ('cancel_my_order', 'authenticated'),
        ('claim_guest_order', 'authenticated'),
        ('export_my_data', 'authenticated'),
        ('anonymize_my_account', 'authenticated'),
        ('admin_dashboard_stats', 'authenticated'),
        ('admin_adjust_stock', 'authenticated'),
        ('admin_set_order_status', 'authenticated'),
        ('admin_save_delivery_settings', 'authenticated'),
        ('admin_update_product_variant', 'authenticated'),
        ('admin_set_product_image_primary', 'authenticated'),
        ('track_order', 'anon'),
        ('track_order', 'authenticated')
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
  pg_catalog.has_function_privilege(
    'anon',
    'public.create_order(uuid,jsonb,jsonb,jsonb,public.payment_method,boolean)',
    'execute'
  ),
  'anon peut créer une commande uniquement via la RPC sécurisée'
);
select ok(
  pg_catalog.has_function_privilege(
    'authenticated',
    'public.create_order(uuid,jsonb,jsonb,jsonb,public.payment_method,boolean)',
    'execute'
  ),
  'authenticated peut créer une commande uniquement via la RPC sécurisée'
);
select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.get_order_for_viewer(text,text)',
    'execute'
  )
    and pg_catalog.has_function_privilege(
      'authenticated',
      'public.get_order_for_viewer(text,text)',
      'execute'
    ),
  'le lecteur de commande est accessible aux visiteurs et aux clients'
);
select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.start_payment(text,text,public.payment_method,text)',
    'execute'
  )
    and pg_catalog.has_function_privilege(
      'authenticated',
      'public.start_payment(text,text,public.payment_method,text)',
      'execute'
    ),
  'le démarrage du paiement passe par sa RPC sécurisée'
);
select ok(
  pg_catalog.has_function_privilege(
    'anon',
    'public.resolve_payment(text,text,text,public.attempt_outcome)',
    'execute'
  )
    and pg_catalog.has_function_privilege(
      'authenticated',
      'public.resolve_payment(text,text,text,public.attempt_outcome)',
      'execute'
    ),
  'la résolution du paiement passe par sa RPC sécurisée'
);
select ok(
  pg_catalog.has_function_privilege('anon', 'public.track_order(text,text)', 'execute')
    and pg_catalog.has_function_privilege(
      'authenticated',
      'public.track_order(text,text)',
      'execute'
    ),
  'le suivi de commande est accessible aux visiteurs et aux clients'
);
select ok(
  not pg_catalog.has_function_privilege('anon', 'public.expire_overdue_orders()', 'execute')
    and not pg_catalog.has_function_privilege(
      'authenticated',
      'public.expire_overdue_orders()',
      'execute'
    ),
  'l’expiration des commandes n’est pas appelable par l’API publique'
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
