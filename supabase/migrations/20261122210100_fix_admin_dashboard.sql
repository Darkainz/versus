create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_day_start timestamptz := pg_catalog.date_trunc(
    'day',
    pg_catalog.now() at time zone 'Africa/Lome'
  ) at time zone 'Africa/Lome';
  v_week_start timestamptz := pg_catalog.date_trunc(
    'week',
    pg_catalog.now() at time zone 'Africa/Lome'
  ) at time zone 'Africa/Lome';
  v_month_start timestamptz := pg_catalog.date_trunc(
    'month',
    pg_catalog.now() at time zone 'Africa/Lome'
  ) at time zone 'Africa/Lome';
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;

  return pg_catalog.jsonb_build_object(
    'orders_pending', (
      select pg_catalog.count(*)::integer
      from public.orders as orders
      where orders.status = 'pending_payment'
    ),
    'orders_preparing', (
      select pg_catalog.count(*)::integer
      from public.orders as orders
      where orders.status = 'preparing'
    ),
    'orders_shipped', (
      select pg_catalog.count(*)::integer
      from public.orders as orders
      where orders.status = 'shipped'
    ),
    'stock_out', (
      select pg_catalog.count(*)::integer
      from public.product_variants as variants
      where variants.is_active
        and variants.stock = 0
    ),
    'stock_low', (
      select pg_catalog.count(*)::integer
      from public.product_variants as variants
      join public.products as products on products.id = variants.product_id
      where products.is_active
        and variants.is_active
        and variants.stock between 1 and 5
    ),
    'revenue_day', (
      select coalesce(pg_catalog.sum(orders.total_fcfa), 0::bigint)::integer
      from public.orders as orders
      where orders.status not in ('cancelled')
        and orders.created_at >= v_day_start
    ),
    'revenue_week', (
      select coalesce(pg_catalog.sum(orders.total_fcfa), 0::bigint)::integer
      from public.orders as orders
      where orders.status not in ('cancelled')
        and orders.created_at >= v_week_start
    ),
    'revenue_month', (
      select coalesce(pg_catalog.sum(orders.total_fcfa), 0::bigint)::integer
      from public.orders as orders
      where orders.status not in ('cancelled')
        and orders.created_at >= v_month_start
    ),
    'latest_orders', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'number', orders.number,
          'status', orders.status,
          'payment_status', orders.payment_status,
          'total_fcfa', orders.total_fcfa,
          'created_at', orders.created_at
        )
        order by orders.created_at desc
      )
      from (
        select *
        from public.orders
        order by created_at desc
        limit 5
      ) as orders
    ), '[]'::jsonb)
  );
end;
$$;
