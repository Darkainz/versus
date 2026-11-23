create function public.create_order(
  p_idempotency_key uuid,
  p_items jsonb,
  p_customer jsonb,
  p_delivery jsonb,
  p_method public.payment_method,
  p_fictitious_ack boolean
)
returns table (
  order_number text,
  access_token text,
  status public.order_status,
  payment_status public.payment_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing record;
  v_item jsonb;
  v_line record;
  v_variant record;
  v_settings record;
  v_quote jsonb;
  v_quote_items jsonb;
  v_name text;
  v_phone text;
  v_email text;
  v_zone_code text;
  v_city text;
  v_district text;
  v_landmark text;
  v_instructions text;
  v_order_id uuid;
  v_order_number text;
  v_access_token text;
  v_status public.order_status;
  v_payment_status public.payment_status;
  v_seen integer := 0;
  v_count integer;
  v_qty integer;
  v_stock_after integer;
begin
  if p_idempotency_key is null then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_idempotency_key::text, 0)
  );

  select orders.id, orders.number, orders.status, orders.payment_status
  into v_existing
  from public.orders
  where orders.idempotency_key = p_idempotency_key;

  if found then
    order_number := v_existing.number;
    access_token := null;
    status := v_existing.status;
    payment_status := v_existing.payment_status;
    return next;
    return;
  end if;

  if p_fictitious_ack is distinct from true then
    raise exception using errcode = 'P0001', message = 'VS_ACK_REQUIRED';
  end if;

  if p_method is null or p_items is null
    or pg_catalog.jsonb_typeof(p_items) <> 'array'
    or pg_catalog.jsonb_array_length(p_items) not between 1 and 10
    or p_customer is null or pg_catalog.jsonb_typeof(p_customer) <> 'object'
    or p_delivery is null or pg_catalog.jsonb_typeof(p_delivery) <> 'object'
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  if pg_catalog.jsonb_typeof(p_customer -> 'name') is distinct from 'string'
    or pg_catalog.jsonb_typeof(p_customer -> 'phone') is distinct from 'string'
    or (
      p_customer ? 'email'
      and pg_catalog.jsonb_typeof(p_customer -> 'email') not in ('string', 'null')
    )
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  v_name := pg_catalog.btrim(p_customer ->> 'name');
  v_phone := pg_catalog.btrim(p_customer ->> 'phone');
  v_email := nullif(pg_catalog.btrim(p_customer ->> 'email'), '');

  if pg_catalog.char_length(v_name) not between 2 and 120
    or v_phone !~ '^\+228[0-9]{8}$'
    or (
      v_email is not null
      and (
        pg_catalog.char_length(v_email) > 254
        or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    )
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  if pg_catalog.jsonb_typeof(p_delivery -> 'zone_code') is distinct from 'string'
    or pg_catalog.jsonb_typeof(p_delivery -> 'city') is distinct from 'string'
    or pg_catalog.jsonb_typeof(p_delivery -> 'district') is distinct from 'string'
    or pg_catalog.jsonb_typeof(p_delivery -> 'landmark') is distinct from 'string'
    or (
      p_delivery ? 'instructions'
      and pg_catalog.jsonb_typeof(p_delivery -> 'instructions') not in ('string', 'null')
    )
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  v_zone_code := p_delivery ->> 'zone_code';
  v_city := pg_catalog.btrim(p_delivery ->> 'city');
  v_district := pg_catalog.btrim(p_delivery ->> 'district');
  v_landmark := pg_catalog.btrim(p_delivery ->> 'landmark');
  v_instructions := nullif(pg_catalog.btrim(p_delivery ->> 'instructions'), '');

  if pg_catalog.char_length(v_city) not between 1 and 100
    or pg_catalog.char_length(v_district) not between 1 and 100
    or pg_catalog.char_length(v_landmark) not between 1 and 200
    or (v_instructions is not null and pg_catalog.char_length(v_instructions) > 500)
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  for v_item in select value from pg_catalog.jsonb_array_elements(p_items) loop
    if pg_catalog.jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item ->> 'sku', '') !~ '^[A-Z0-9-]{4,40}$'
      or coalesce(v_item ->> 'qty', '') !~ '^[1-9][0-9]{0,2}$'
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
  end loop;

  select settings.cod_max_fcfa,
    settings.payment_ttl_minutes,
    settings.attempt_ttl_seconds,
    settings.max_qty_per_line,
    settings.max_orders_per_phone_hour,
    settings.max_open_cod_per_phone,
    settings.max_orders_per_hour
  into v_settings
  from public.shop_settings as settings
  where settings.id;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_SETTINGS_MISSING';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object('sku', grouped.sku, 'qty', grouped.qty)
      order by grouped.sku
    ),
    '[]'::jsonb
  )
  into v_quote_items
  from (
    select item ->> 'sku' as sku, pg_catalog.sum((item ->> 'qty')::integer)::integer as qty
    from pg_catalog.jsonb_array_elements(p_items) as source(item)
    group by item ->> 'sku'
  ) as grouped;

  if exists (
    select 1
    from pg_catalog.jsonb_array_elements(v_quote_items) as source(item)
    where (source.item ->> 'qty')::integer > v_settings.max_qty_per_line
  ) then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('phone:' || v_phone, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('orders:global', 0)
  );

  select pg_catalog.count(*)::integer
  into v_count
  from private.order_attempts as attempts
  where attempts.phone = v_phone
    and attempts.attempted_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= v_settings.max_orders_per_phone_hour then
    raise exception using
      errcode = 'P0001',
      message = 'VS_RATE_LIMITED',
      detail = '{"reason":"phone_hourly"}';
  end if;

  if p_method = 'cash_on_delivery' then
    select pg_catalog.count(*)::integer
    into v_count
    from public.orders as orders
    where orders.customer_phone = v_phone
      and orders.payment_status = 'cash_due'
      and orders.status not in ('cancelled', 'delivered');

    if v_count >= v_settings.max_open_cod_per_phone then
      raise exception using
        errcode = 'P0001',
        message = 'VS_RATE_LIMITED',
        detail = '{"reason":"cod_open"}';
    end if;
  end if;

  select pg_catalog.count(*)::integer
  into v_count
  from private.order_attempts as attempts
  where attempts.attempted_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= v_settings.max_orders_per_hour then
    raise exception using
      errcode = 'P0001',
      message = 'VS_RATE_LIMITED',
      detail = '{"reason":"global"}';
  end if;

  for v_variant in
    select variants.id, variants.sku, variants.is_active, products.is_active as product_active
    from pg_catalog.jsonb_array_elements(v_quote_items) as source(item)
    join public.product_variants as variants on variants.sku = source.item ->> 'sku'
    join public.products as products on products.id = variants.product_id
    order by variants.id
    for update of variants
  loop
    v_seen := v_seen + 1;
    if not v_variant.is_active or not v_variant.product_active then
      raise exception using
        errcode = 'P0001',
        message = 'VS_UNAVAILABLE',
        detail = v_variant.sku;
    end if;
  end loop;

  if v_seen <> pg_catalog.jsonb_array_length(v_quote_items) then
    raise exception using errcode = 'P0001', message = 'VS_UNAVAILABLE';
  end if;

  v_quote := private.compute_quote(v_quote_items, v_zone_code);
  if not coalesce((v_quote ->> 'valid')::boolean, false) then
    for v_line in
      select source.item
      from pg_catalog.jsonb_array_elements(v_quote -> 'lines') as source(item)
    loop
      if coalesce(v_line.item -> 'issues', '[]'::jsonb) ? 'unavailable' then
        raise exception using
          errcode = 'P0001',
          message = 'VS_UNAVAILABLE',
          detail = v_line.item ->> 'sku';
      elsif coalesce(v_line.item -> 'issues', '[]'::jsonb) ? 'insufficient_stock' then
        raise exception using
          errcode = 'P0001',
          message = 'VS_OUT_OF_STOCK:' || (v_line.item ->> 'sku'),
          detail = v_line.item ->> 'sku';
      end if;
    end loop;
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  if p_method = 'cash_on_delivery'
    and (v_quote ->> 'total_fcfa')::integer > v_settings.cod_max_fcfa
  then
    raise exception using errcode = 'P0001', message = 'VS_COD_CAP';
  end if;

  v_access_token := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_status := case
    when p_method = 'cash_on_delivery' then 'confirmed'::public.order_status
    else 'pending_payment'::public.order_status
  end;
  v_payment_status := case
    when p_method = 'cash_on_delivery' then 'cash_due'::public.payment_status
    else 'pending'::public.payment_status
  end;
  v_order_number := private.next_order_number();

  insert into public.orders (
    number,
    user_id,
    idempotency_key,
    access_token_hash,
    status,
    payment_method,
    payment_status,
    customer_name,
    customer_phone,
    customer_email,
    zone_code,
    city,
    district,
    landmark,
    instructions,
    eta_label,
    subtotal_fcfa,
    shipping_fcfa,
    fictitious_ack_at,
    payment_deadline
  )
  values (
    v_order_number,
    auth.uid(),
    p_idempotency_key,
    extensions.digest(v_access_token, 'sha256'),
    v_status,
    p_method,
    v_payment_status,
    v_name,
    v_phone,
    v_email,
    v_quote ->> 'zone_code',
    v_city,
    v_district,
    v_landmark,
    v_instructions,
    v_quote ->> 'eta_label',
    (v_quote ->> 'subtotal_fcfa')::integer,
    (v_quote ->> 'delivery_fee_fcfa')::integer,
    pg_catalog.now(),
    case
      when v_status = 'pending_payment' then
        pg_catalog.now() + pg_catalog.make_interval(mins => v_settings.payment_ttl_minutes)
      else null
    end
  )
  returning id into v_order_id;

  for v_line in
    select source.item
    from pg_catalog.jsonb_array_elements(v_quote -> 'lines') as source(item)
    order by source.item ->> 'sku'
  loop
    select variants.id, variants.product_id, variants.sku
    into v_variant
    from public.product_variants as variants
    where variants.sku = v_line.item ->> 'sku';

    v_qty := (v_line.item ->> 'qty')::integer;

    update public.product_variants as variants
    set stock = variants.stock - v_qty
    where variants.id = v_variant.id
      and variants.stock >= v_qty
    returning variants.stock into v_stock_after;

    if not found then
      raise exception using
        errcode = 'P0001',
        message = 'VS_OUT_OF_STOCK:' || (v_line.item ->> 'sku'),
        detail = v_line.item ->> 'sku';
    end if;

    insert into public.order_items (
      order_id,
      variant_id,
      product_id,
      product_name,
      variant_label,
      sku,
      unit_price_fcfa,
      quantity
    )
    values (
      v_order_id,
      v_variant.id,
      v_variant.product_id,
      v_line.item ->> 'name',
      v_line.item ->> 'variant_label',
      v_line.item ->> 'sku',
      (v_line.item ->> 'price_fcfa')::integer,
      v_qty
    );

    insert into public.stock_movements (
      variant_id,
      delta,
      reason,
      stock_after,
      order_id,
      actor_id
    )
    values (
      v_variant.id,
      -v_qty,
      'order',
      v_stock_after,
      v_order_id,
      auth.uid()
    );
  end loop;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    actor,
    actor_id,
    note
  )
  values (
    v_order_id,
    null,
    v_status,
    'customer',
    auth.uid(),
    'Commande créée'
  );

  insert into private.order_attempts (phone)
  values (v_phone);

  order_number := v_order_number;
  access_token := v_access_token;
  status := v_status;
  payment_status := v_payment_status;
  return next;
end;
$$;

revoke all on function public.create_order(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  public.payment_method,
  boolean
) from public, anon, authenticated;
grant execute on function public.create_order(
  uuid,
  jsonb,
  jsonb,
  jsonb,
  public.payment_method,
  boolean
) to anon, authenticated;
