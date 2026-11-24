create function private.release_order_stock(
  p_order_id uuid,
  p_reason public.stock_reason
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_stock_after integer;
begin
  for v_item in
    select items.variant_id, items.quantity, variants.stock
    from public.order_items as items
    join public.product_variants as variants on variants.id = items.variant_id
    where items.order_id = p_order_id
    order by variants.id
    for update of variants
  loop
    update public.product_variants as variants
    set stock = variants.stock + v_item.quantity
    where variants.id = v_item.variant_id
    returning variants.stock into v_stock_after;

    insert into public.stock_movements (
      variant_id,
      delta,
      reason,
      stock_after,
      order_id
    )
    values (
      v_item.variant_id,
      v_item.quantity,
      p_reason,
      v_stock_after,
      p_order_id
    );
  end loop;
end;
$$;
revoke all on function private.release_order_stock(uuid, public.stock_reason)
  from public, anon, authenticated;

create function private.expire_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found
    or v_order.status <> 'pending_payment'
    or v_order.payment_deadline > pg_catalog.now()
  then
    return false;
  end if;

  update public.payment_attempts as attempts
  set outcome = 'expired',
      resolved_at = pg_catalog.now()
  where attempts.order_id = v_order.id
    and attempts.outcome = 'pending';

  update public.orders as orders
  set status = 'cancelled',
      payment_status = 'expired',
      payment_deadline = null,
      cancel_reason = 'Paiement non abouti'
  where orders.id = v_order.id;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    actor,
    note
  )
  values (
    v_order.id,
    'pending_payment',
    'cancelled',
    'system',
    'Paiement non abouti'
  );

  perform private.release_order_stock(v_order.id, 'order_cancelled');
  return true;
end;
$$;
revoke all on function private.expire_order(uuid) from public, anon, authenticated;

create function public.get_order_for_viewer(p_number text, p_token text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_number is null or pg_catalog.char_length(p_number) > 20 then
    return null;
  end if;

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found then
    return null;
  end if;

  if not (v_order.user_id is not null and v_order.user_id = auth.uid())
    and (
      p_token is null
      or pg_catalog.char_length(p_token) > 128
      or extensions.digest(p_token, 'sha256') <> v_order.access_token_hash
    )
  then
    return null;
  end if;

  perform private.expire_order(v_order.id);

  select *
  into v_order
  from public.orders
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'number', v_order.number,
    'status', v_order.status,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'customer_email', v_order.customer_email,
    'zone_code', v_order.zone_code,
    'city', v_order.city,
    'district', v_order.district,
    'landmark', v_order.landmark,
    'instructions', v_order.instructions,
    'eta_label', v_order.eta_label,
    'subtotal_fcfa', v_order.subtotal_fcfa,
    'shipping_fcfa', v_order.shipping_fcfa,
    'total_fcfa', v_order.total_fcfa,
    'created_at', v_order.created_at,
    'payment_deadline', v_order.payment_deadline,
    'items', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'product_name', items.product_name,
          'variant_label', items.variant_label,
          'sku', items.sku,
          'unit_price_fcfa', items.unit_price_fcfa,
          'quantity', items.quantity,
          'line_total_fcfa', items.line_total_fcfa
        )
        order by items.product_name, items.sku
      )
      from public.order_items as items
      where items.order_id = v_order.id
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
      where history.order_id = v_order.id
    ), '[]'::jsonb),
    'payment_attempt', (
      select pg_catalog.jsonb_build_object(
        'method', attempts.method,
        'msisdn_masked', attempts.msisdn_masked,
        'reference', attempts.reference,
        'outcome', attempts.outcome,
        'expires_at', attempts.expires_at
      )
      from public.payment_attempts as attempts
      where attempts.order_id = v_order.id
      order by attempts.created_at desc
      limit 1
    )
  );
end;
$$;
revoke all on function public.get_order_for_viewer(text, text) from public, anon, authenticated;
grant execute on function public.get_order_for_viewer(text, text) to anon, authenticated;

create function public.start_payment(
  p_number text,
  p_token text,
  p_method public.payment_method,
  p_msisdn text default null
)
returns table (reference text, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_settings record;
  v_reference text;
  v_msisdn_masked text;
  v_prefix text;
  v_expires_at timestamptz;
  v_count integer;
  v_attempt integer;
begin
  if p_number is null or p_method is null then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if not (v_order.user_id is not null and v_order.user_id = auth.uid())
    and (
      p_token is null
      or pg_catalog.char_length(p_token) > 128
      or extensions.digest(p_token, 'sha256') <> v_order.access_token_hash
    )
  then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception using errcode = 'P0001', message = 'VS_NOT_PAYABLE';
  end if;

  if private.expire_order(v_order.id) then
    return;
  end if;

  select settings.cod_max_fcfa,
    settings.attempt_ttl_seconds,
    settings.max_open_cod_per_phone
  into v_settings
  from public.shop_settings as settings
  where settings.id;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_SETTINGS_MISSING';
  end if;

  if p_method = 'cash_on_delivery' then
    if p_msisdn is not null then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
    if v_order.total_fcfa > v_settings.cod_max_fcfa then
      raise exception using errcode = 'P0001', message = 'VS_COD_CAP';
    end if;

    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('phone:' || v_order.customer_phone, 0)
    );

    select pg_catalog.count(*)::integer
    into v_count
    from public.orders as orders
    where orders.customer_phone = v_order.customer_phone
      and orders.payment_status = 'cash_due'
      and orders.status not in ('cancelled', 'delivered');

    if v_count >= v_settings.max_open_cod_per_phone then
      raise exception using
        errcode = 'P0001',
        message = 'VS_RATE_LIMITED',
        detail = '{"reason":"cod_open"}';
    end if;

    update public.payment_attempts as attempts
    set outcome = 'expired',
        resolved_at = pg_catalog.now()
    where attempts.order_id = v_order.id
      and attempts.outcome = 'pending';

    update public.orders as orders
    set status = 'confirmed',
        payment_method = 'cash_on_delivery',
        payment_status = 'cash_due',
        payment_deadline = null
    where orders.id = v_order.id;

    insert into public.order_status_history (
      order_id,
      from_status,
      to_status,
      actor,
      note
    )
    values (
      v_order.id,
      'pending_payment',
      'confirmed',
      'system',
      'Paiement à la livraison choisi'
    );
    return;
  end if;

  if p_method not in ('tmoney', 'flooz', 'card')
    or (
      p_method in ('tmoney', 'flooz')
      and (p_msisdn is null or p_msisdn !~ '^\+228[0-9]{8}$')
    )
    or (p_method = 'card' and p_msisdn is not null)
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  v_msisdn_masked := case
    when p_msisdn is null then null
    else '+228 ' || pg_catalog.substr(p_msisdn, 5, 2) || ' •• •• ' || pg_catalog.right(p_msisdn, 2)
  end;
  v_prefix := case p_method
    when 'tmoney' then 'TM'
    when 'flooz' then 'FL'
    else 'CB'
  end;

  update public.payment_attempts as attempts
  set outcome = 'expired',
      resolved_at = pg_catalog.now()
  where attempts.order_id = v_order.id
    and attempts.outcome = 'pending';

  v_expires_at := least(
    pg_catalog.now() + pg_catalog.make_interval(secs => v_settings.attempt_ttl_seconds),
    v_order.payment_deadline
  );

  for v_attempt in 1..5 loop
    v_reference := 'SIM-' || v_prefix || '-' ||
      pg_catalog.upper(pg_catalog.substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    exit when not exists (
      select 1
      from public.payment_attempts as attempts
      where attempts.reference = v_reference
    );
  end loop;

  if v_reference is null or exists (
    select 1
    from public.payment_attempts as attempts
    where attempts.reference = v_reference
  ) then
    raise exception using errcode = 'P0001', message = 'VS_REFERENCE_FAILED';
  end if;

  update public.orders as orders
  set payment_method = p_method,
      payment_status = 'pending'
  where orders.id = v_order.id;

  insert into public.payment_attempts (
    order_id,
    method,
    msisdn_masked,
    reference,
    expires_at
  )
  values (
    v_order.id,
    p_method,
    v_msisdn_masked,
    v_reference,
    v_expires_at
  );

  reference := v_reference;
  expires_at := v_expires_at;
  return next;
end;
$$;
revoke all on function public.start_payment(text, text, public.payment_method, text)
  from public, anon, authenticated;
grant execute on function public.start_payment(text, text, public.payment_method, text)
  to anon, authenticated;

create function public.resolve_payment(
  p_number text,
  p_token text,
  p_reference text,
  p_outcome public.attempt_outcome
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
begin
  if p_number is null
    or p_reference is null
    or p_outcome is null
    or p_outcome not in ('succeeded', 'failed')
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if not (v_order.user_id is not null and v_order.user_id = auth.uid())
    and (
      p_token is null
      or pg_catalog.char_length(p_token) > 128
      or extensions.digest(p_token, 'sha256') <> v_order.access_token_hash
    )
  then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_order.status <> 'pending_payment' then
    raise exception using errcode = 'P0001', message = 'VS_NOT_PAYABLE';
  end if;

  if private.expire_order(v_order.id) then
    return false;
  end if;

  select *
  into v_attempt
  from public.payment_attempts as attempts
  where attempts.order_id = v_order.id
    and attempts.reference = p_reference
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_attempt.outcome <> 'pending' then
    raise exception using errcode = 'P0001', message = 'VS_ATTEMPT_RESOLVED';
  end if;

  if v_attempt.expires_at <= pg_catalog.now() then
    update public.payment_attempts as attempts
    set outcome = 'expired',
        resolved_at = pg_catalog.now()
    where attempts.id = v_attempt.id;
    return false;
  end if;

  update public.payment_attempts as attempts
  set outcome = p_outcome,
      resolved_at = pg_catalog.now()
  where attempts.id = v_attempt.id;

  if p_outcome = 'succeeded' then
    update public.orders as orders
    set status = 'confirmed',
        payment_status = 'succeeded',
        payment_deadline = null
    where orders.id = v_order.id;

    insert into public.order_status_history (
      order_id,
      from_status,
      to_status,
      actor,
      note
    )
    values (
      v_order.id,
      'pending_payment',
      'confirmed',
      'system',
      'Paiement simulé validé'
    );
  else
    update public.orders as orders
    set payment_status = 'failed'
    where orders.id = v_order.id;
  end if;

  return true;
end;
$$;
revoke all on function public.resolve_payment(
  text,
  text,
  text,
  public.attempt_outcome
) from public, anon, authenticated;
grant execute on function public.resolve_payment(
  text,
  text,
  text,
  public.attempt_outcome
) to anon, authenticated;

create function public.track_order(p_number text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_count integer;
begin
  if p_number is null
    or p_number !~ '^VS-[0-9]{4}-[0-9]{6}$'
    or p_phone is null
    or p_phone !~ '^\+228[0-9]{8}$'
  then
    return null;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('track:' || p_number, 0)
  );

  select pg_catalog.count(*)::integer
  into v_count
  from private.track_attempts as attempts
  where attempts.order_number = p_number
    and attempts.attempted_at >= pg_catalog.now() - interval '1 hour';

  if v_count >= 10 then
    raise exception using
      errcode = 'P0001',
      message = 'VS_RATE_LIMITED',
      detail = '{"reason":"tracking_hourly"}';
  end if;

  insert into private.track_attempts (order_number)
  values (p_number);

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found or v_order.customer_phone <> p_phone then
    return null;
  end if;

  perform private.expire_order(v_order.id);

  select *
  into v_order
  from public.orders
  where id = v_order.id;

  return pg_catalog.jsonb_build_object(
    'number', v_order.number,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'city', v_order.city,
    'eta_label', v_order.eta_label,
    'created_at', v_order.created_at,
    'items', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'product_name', items.product_name,
          'variant_label', items.variant_label,
          'quantity', items.quantity,
          'line_total_fcfa', items.line_total_fcfa
        )
        order by items.product_name, items.sku
      )
      from public.order_items as items
      where items.order_id = v_order.id
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
      where history.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.track_order(text, text) from public, anon, authenticated;
grant execute on function public.track_order(text, text) to anon, authenticated;

create function public.expire_overdue_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order record;
  v_expired integer := 0;
begin
  for v_order in
    select orders.id
    from public.orders as orders
    where orders.status = 'pending_payment'
      and orders.payment_deadline <= pg_catalog.now()
    order by orders.payment_deadline, orders.id
    for update skip locked
  loop
    if private.expire_order(v_order.id) then
      v_expired := v_expired + 1;
    end if;
  end loop;

  return v_expired;
end;
$$;
revoke all on function public.expire_overdue_orders() from public, anon, authenticated;
