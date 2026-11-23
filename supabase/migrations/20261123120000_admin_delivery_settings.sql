create or replace function public.admin_save_delivery_settings(
  p_zones jsonb,
  p_settings jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_zone jsonb;
  v_code text;
  v_value text;
  v_key text;
  v_numeric numeric;
  v_codes text[] := array[]::text[];
  v_updated integer;
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;

  if pg_catalog.jsonb_typeof(p_zones) is distinct from 'array'
    or pg_catalog.jsonb_typeof(p_settings) is distinct from 'object'
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  if pg_catalog.jsonb_array_length(p_zones) <> 6 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;
  select pg_catalog.count(*)::integer
  into v_updated
  from pg_catalog.jsonb_object_keys(p_settings);
  if v_updated <> 8 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  for v_zone in
    select value
    from pg_catalog.jsonb_array_elements(p_zones) as zones(value)
  loop
    if pg_catalog.jsonb_typeof(v_zone) is distinct from 'object'
      or pg_catalog.jsonb_typeof(v_zone -> 'code') is distinct from 'string'
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
    select pg_catalog.count(*)::integer
    into v_updated
    from pg_catalog.jsonb_object_keys(v_zone);
    if v_updated <> 4 then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;

    v_code := v_zone ->> 'code';
    if v_code not in ('lome', 'maritime', 'plateaux', 'centrale', 'kara', 'savanes')
      or v_code = any(v_codes)
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
    v_codes := pg_catalog.array_append(v_codes, v_code);

    foreach v_key in array array['fee_fcfa'] loop
      if pg_catalog.jsonb_typeof(v_zone -> v_key) is distinct from 'number' then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
      v_value := v_zone ->> v_key;
      if v_value !~ '^(0|[1-9][0-9]*)$' then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
      v_numeric := v_value::numeric;
      if v_numeric > 2147483647 then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
    end loop;

    if pg_catalog.jsonb_typeof(v_zone -> 'free_from_fcfa') is distinct from 'null' then
      if pg_catalog.jsonb_typeof(v_zone -> 'free_from_fcfa') is distinct from 'number' then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
      v_value := v_zone ->> 'free_from_fcfa';
      if v_value !~ '^[1-9][0-9]*$' then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
      v_numeric := v_value::numeric;
      if v_numeric > 2147483647 then
        raise exception using errcode = 'P0001', message = 'VS_INVALID';
      end if;
    end if;

    if pg_catalog.jsonb_typeof(v_zone -> 'eta_label') is distinct from 'string'
      or pg_catalog.btrim(v_zone ->> 'eta_label') = ''
      or pg_catalog.char_length(v_zone ->> 'eta_label') > 120
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
  end loop;

  if pg_catalog.jsonb_typeof(p_settings -> 'banner_text') is distinct from 'string'
    or pg_catalog.btrim(p_settings ->> 'banner_text') = ''
    or pg_catalog.char_length(p_settings ->> 'banner_text') > 300
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  foreach v_key in array array[
    'cod_max_fcfa',
    'payment_ttl_minutes',
    'attempt_ttl_seconds',
    'max_qty_per_line',
    'max_orders_per_phone_hour',
    'max_open_cod_per_phone',
    'max_orders_per_hour'
  ] loop
    if pg_catalog.jsonb_typeof(p_settings -> v_key) is distinct from 'number' then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
    v_value := p_settings ->> v_key;
    if v_value !~ '^[1-9][0-9]*$' then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
    v_numeric := v_value::numeric;

    if (v_key = 'cod_max_fcfa' and v_numeric > 2147483647)
      or (v_key = 'payment_ttl_minutes' and v_numeric > 1440)
      or (v_key = 'max_qty_per_line' and v_numeric > 5)
      or (
        v_key in (
          'attempt_ttl_seconds',
          'max_orders_per_phone_hour',
          'max_open_cod_per_phone',
          'max_orders_per_hour'
        )
        and v_numeric > 32767
      )
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
  end loop;

  update public.delivery_zones as zones
  set fee_fcfa = (input.zone ->> 'fee_fcfa')::integer,
      free_from_fcfa = case
        when pg_catalog.jsonb_typeof(input.zone -> 'free_from_fcfa') = 'null' then null
        else (input.zone ->> 'free_from_fcfa')::integer
      end,
      eta_label = pg_catalog.btrim(input.zone ->> 'eta_label')
  from pg_catalog.jsonb_array_elements(p_zones) as input(zone)
  where zones.code = input.zone ->> 'code';
  get diagnostics v_updated = row_count;
  if v_updated <> 6 then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  update public.shop_settings
  set banner_text = pg_catalog.btrim(p_settings ->> 'banner_text'),
      cod_max_fcfa = (p_settings ->> 'cod_max_fcfa')::integer,
      payment_ttl_minutes = (p_settings ->> 'payment_ttl_minutes')::smallint,
      attempt_ttl_seconds = (p_settings ->> 'attempt_ttl_seconds')::smallint,
      max_qty_per_line = (p_settings ->> 'max_qty_per_line')::smallint,
      max_orders_per_phone_hour = (p_settings ->> 'max_orders_per_phone_hour')::smallint,
      max_open_cod_per_phone = (p_settings ->> 'max_open_cod_per_phone')::smallint,
      max_orders_per_hour = (p_settings ->> 'max_orders_per_hour')::smallint
  where id = true;
  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_save_delivery_settings(jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.admin_save_delivery_settings(jsonb, jsonb)
  to authenticated;
