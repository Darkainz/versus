create function public.export_my_data()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'VS_UNAUTHENTICATED';
  end if;

  return pg_catalog.jsonb_build_object(
    'schema_version', 1,
    'exported_at', pg_catalog.now(),
    'profile', (
      select pg_catalog.to_jsonb(profiles)
      from public.profiles as profiles
      where profiles.id = v_user_id
    ),
    'addresses', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(addresses) order by addresses.created_at)
      from public.addresses as addresses
      where addresses.user_id = v_user_id
    ), '[]'::jsonb),
    'cart', (
      select pg_catalog.jsonb_build_object(
        'items', carts.items,
        'updated_at', carts.updated_at
      )
      from public.carts as carts
      where carts.user_id = v_user_id
    ),
    'orders', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'number', orders.number,
          'status', orders.status,
          'payment_method', orders.payment_method,
          'payment_status', orders.payment_status,
          'customer_name', orders.customer_name,
          'customer_phone', orders.customer_phone,
          'customer_email', orders.customer_email,
          'zone_code', orders.zone_code,
          'city', orders.city,
          'district', orders.district,
          'landmark', orders.landmark,
          'instructions', orders.instructions,
          'subtotal_fcfa', orders.subtotal_fcfa,
          'shipping_fcfa', orders.shipping_fcfa,
          'total_fcfa', orders.total_fcfa,
          'created_at', orders.created_at,
          'payment_deadline', orders.payment_deadline,
          'anonymized_at', orders.anonymized_at,
          'items', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'product_name', order_items.product_name,
                'variant_label', order_items.variant_label,
                'sku', order_items.sku,
                'unit_price_fcfa', order_items.unit_price_fcfa,
                'quantity', order_items.quantity,
                'line_total_fcfa', order_items.line_total_fcfa
              )
              order by order_items.product_name, order_items.sku
            )
            from public.order_items as order_items
            where order_items.order_id = orders.id
          ), '[]'::jsonb),
          'history', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'from_status', history.from_status,
                'to_status', history.to_status,
                'actor', history.actor,
                'note', history.note,
                'created_at', history.created_at
              )
              order by history.created_at, history.id
            )
            from public.order_status_history as history
            where history.order_id = orders.id
          ), '[]'::jsonb),
          'payment_attempts', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'method', attempts.method,
                'msisdn_masked', attempts.msisdn_masked,
                'reference', attempts.reference,
                'outcome', attempts.outcome,
                'expires_at', attempts.expires_at,
                'created_at', attempts.created_at
              )
              order by attempts.created_at, attempts.id
            )
            from public.payment_attempts as attempts
            where attempts.order_id = orders.id
          ), '[]'::jsonb)
        )
        order by orders.created_at, orders.id
      )
      from public.orders as orders
      where orders.user_id = v_user_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.export_my_data() from public, anon, authenticated;
grant execute on function public.export_my_data() to authenticated;

create function public.anonymize_my_account()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_count integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'VS_UNAUTHENTICATED';
  end if;

  update public.order_status_history as history
  set actor_id = null,
      note = null
  where history.order_id in (
    select orders.id
    from public.orders as orders
    where orders.user_id = v_user_id
  );

  update public.payment_attempts as attempts
  set msisdn_masked = null
  where attempts.order_id in (
    select orders.id
    from public.orders as orders
    where orders.user_id = v_user_id
  );

  update public.orders as orders
  set user_id = null,
      customer_name = 'Client supprimé',
      customer_phone = '+22800000000',
      customer_email = null,
      city = 'Supprimée',
      district = 'Supprimé',
      landmark = 'Supprimé',
      instructions = null,
      cancel_reason = null,
      anonymized_at = coalesce(orders.anonymized_at, pg_catalog.now())
  where orders.user_id = v_user_id;

  get diagnostics v_order_count = row_count;
  return v_order_count;
end;
$$;

revoke all on function public.anonymize_my_account() from public, anon, authenticated;
grant execute on function public.anonymize_my_account() to authenticated;
