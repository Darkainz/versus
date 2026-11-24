create function public.cancel_my_order(p_number text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_number is null or pg_catalog.char_length(p_number) > 20 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found
    or auth.uid() is null
    or v_order.user_id is distinct from auth.uid()
  then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_order.status = 'pending_payment'
    and private.expire_order(v_order.id)
  then
    return false;
  end if;

  if not exists (
    select 1
    from public.order_transitions as transitions
    where transitions.from_status = v_order.status
      and transitions.to_status = 'cancelled'
      and transitions.actor = 'customer'
  ) then
    raise exception using errcode = 'P0001', message = 'VS_NOT_CANCELLABLE';
  end if;

  update public.payment_attempts as attempts
  set outcome = 'expired',
      resolved_at = pg_catalog.now()
  where attempts.order_id = v_order.id
    and attempts.outcome = 'pending';

  update public.orders as orders
  set status = 'cancelled',
      payment_deadline = null,
      cancel_reason = 'Annulée par le client'
  where orders.id = v_order.id;

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
    'cancelled',
    'customer',
    auth.uid(),
    'Annulée par le client'
  );

  perform private.release_order_stock(v_order.id, 'order_cancelled');
  return true;
end;
$$;

revoke all on function public.cancel_my_order(text) from public, anon, authenticated;
grant execute on function public.cancel_my_order(text) to authenticated;

create function public.claim_guest_order(p_number text, p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_number is null
    or p_token is null
    or pg_catalog.char_length(p_number) > 20
    or pg_catalog.char_length(p_token) > 128
    or auth.uid() is null
  then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  select *
  into v_order
  from public.orders
  where number = p_number
  for update;

  if not found
    or v_order.anonymized_at is not null
    or extensions.digest(p_token, 'sha256') <> v_order.access_token_hash
  then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_order.user_id = auth.uid() then
    return true;
  end if;

  if v_order.user_id is not null then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  update public.orders
  set user_id = auth.uid()
  where id = v_order.id;
  return true;
end;
$$;

revoke all on function public.claim_guest_order(text, text) from public, anon, authenticated;
grant execute on function public.claim_guest_order(text, text) to authenticated;
