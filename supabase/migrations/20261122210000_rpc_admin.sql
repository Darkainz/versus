create function public.admin_dashboard_stats()
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
      select pg_catalog.coalesce(pg_catalog.sum(orders.total_fcfa), 0)::integer
      from public.orders as orders
      where orders.status not in ('cancelled')
        and orders.created_at >= v_day_start
    ),
    'revenue_week', (
      select pg_catalog.coalesce(pg_catalog.sum(orders.total_fcfa), 0)::integer
      from public.orders as orders
      where orders.status not in ('cancelled')
        and orders.created_at >= v_week_start
    ),
    'revenue_month', (
      select pg_catalog.coalesce(pg_catalog.sum(orders.total_fcfa), 0)::integer
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

revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;

create function public.admin_adjust_stock(
  p_variant_id uuid,
  p_delta integer,
  p_reason public.stock_reason,
  p_note text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock_before integer;
  v_stock_after integer;
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;
  if p_variant_id is null
    or p_delta is null
    or p_delta = 0
    or p_reason is null
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;
  if p_note is not null and pg_catalog.char_length(p_note) > 500 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select variants.stock
  into v_stock_before
  from public.product_variants as variants
  where variants.id = p_variant_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  v_stock_after := v_stock_before + p_delta;
  if v_stock_after < 0 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  update public.product_variants as variants
  set stock = v_stock_after
  where variants.id = p_variant_id;

  insert into public.stock_movements (
    variant_id,
    delta,
    reason,
    stock_after,
    actor_id,
    note
  )
  values (
    p_variant_id,
    p_delta,
    p_reason,
    v_stock_after,
    (select auth.uid()),
    p_note
  );

  return v_stock_after;
end;
$$;

revoke all on function public.admin_adjust_stock(uuid, integer, public.stock_reason, text)
  from public, anon, authenticated;
grant execute on function public.admin_adjust_stock(uuid, integer, public.stock_reason, text)
  to authenticated;

create function public.admin_set_order_status(
  p_order_id uuid,
  p_to public.order_status,
  p_note text default null,
  p_cash_collected boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;

  if p_order_id is null or p_to is null then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;
  if p_note is not null and pg_catalog.char_length(p_note) > 500 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.order_transitions as transitions
    where transitions.from_status = v_order.status
      and transitions.to_status = p_to
      and transitions.actor = 'admin'
  ) then
    raise exception using errcode = 'P0001', message = 'VS_NOT_TRANSITION';
  end if;

  if p_to = 'delivered'
    and v_order.payment_method = 'cash_on_delivery'
    and v_order.payment_status = 'cash_due'
  then
    if not p_cash_collected then
      raise exception using errcode = 'P0001', message = 'VS_CASH_REQUIRED';
    end if;
    update public.orders
    set payment_status = 'cash_collected',
        cash_collected_at = pg_catalog.now()
    where id = v_order.id;
  end if;

  update public.orders
  set status = p_to,
      cancel_reason = case
        when p_to = 'cancelled' then coalesce(p_note, 'Annulée par l’administration')
        else cancel_reason
      end
  where id = v_order.id;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    actor,
    actor_id,
    note
  )
  values (
    v_order.id,
    v_order.status,
    p_to,
    'admin',
    (select auth.uid()),
    p_note
  );

  if p_to = 'cancelled' then
    perform private.release_order_stock(v_order.id, 'order_cancelled');
  end if;

  return true;
end;
$$;

revoke all on function public.admin_set_order_status(uuid, public.order_status, text, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_set_order_status(uuid, public.order_status, text, boolean)
  to authenticated;
