create function private.compute_quote(p_items jsonb, p_zone_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_line record;
  v_variant record;
  v_settings record;
  v_zone record;
  v_lines jsonb := '[]'::jsonb;
  v_issues text[];
  v_qty integer;
  v_client_price integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_eta text;
  v_valid boolean := true;
begin
  if jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    if jsonb_typeof(v_item) <> 'object'
      or coalesce(v_item ->> 'sku', '') !~ '^[A-Z0-9-]{4,40}$'
      or coalesce(v_item ->> 'qty', '') !~ '^[1-9][0-9]{0,3}$'
      or (
        v_item ? 'price_fcfa'
        and coalesce(v_item ->> 'price_fcfa', '') !~ '^[0-9]{1,9}$'
      )
    then
      raise exception using errcode = 'P0001', message = 'VS_INVALID';
    end if;
  end loop;

  select max_qty_per_line
  into v_settings
  from public.shop_settings
  where id;
  if not found then
    raise exception using errcode = 'P0001', message = 'VS_SETTINGS_MISSING';
  end if;

  if p_zone_code is not null then
    select code, fee_fcfa, free_from_fcfa, eta_label
    into v_zone
    from public.delivery_zones
    where code = p_zone_code and is_active;
    if not found then
      raise exception using errcode = 'P0001', message = 'VS_INVALID_ZONE';
    end if;
    v_eta := v_zone.eta_label;
  end if;

  for v_line in
    select
      input.sku,
      sum(input.qty)::integer as requested_qty,
      max(input.client_price) as client_price
    from (
      select
        item ->> 'sku' as sku,
        (item ->> 'qty')::integer as qty,
        case
          when item ? 'price_fcfa' then (item ->> 'price_fcfa')::integer
          else null
        end as client_price
      from jsonb_array_elements(p_items) as source(item)
    ) as input
    group by input.sku
    order by input.sku
  loop
    select variants.sku, variants.price_fcfa, variants.stock, variants.is_active,
      products.is_active as product_active, products.name, products.slug
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.sku = v_line.sku;

    v_issues := array[]::text[];
    v_qty := least(v_line.requested_qty, v_settings.max_qty_per_line);
    if v_line.requested_qty > v_settings.max_qty_per_line then
      v_issues := array_append(v_issues, 'qty_capped');
    end if;

    if not found or not v_variant.is_active or not v_variant.product_active then
      v_issues := array_append(v_issues, 'unavailable');
      v_valid := false;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'sku', v_line.sku, 'name', coalesce(v_variant.name, v_line.sku),
        'slug', v_variant.slug,
        'qty', v_qty, 'stock', 0, 'price_fcfa', null,
        'line_total_fcfa', 0, 'issues', to_jsonb(v_issues)
      ));
      continue;
    end if;

    if v_line.client_price is not null and v_line.client_price <> v_variant.price_fcfa then
      v_issues := array_append(v_issues, 'price_changed');
    end if;
    if v_variant.stock < v_qty then
      v_issues := array_append(v_issues, 'insufficient_stock');
      v_valid := false;
    end if;

    v_line_total := v_variant.price_fcfa * v_qty;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'sku', v_line.sku, 'name', v_variant.name, 'slug', v_variant.slug,
      'qty', v_qty,
      'stock', v_variant.stock, 'price_fcfa', v_variant.price_fcfa,
      'line_total_fcfa', v_line_total, 'issues', to_jsonb(v_issues)
    ));
  end loop;

  if p_zone_code is not null then
    v_delivery_fee := case
      when v_zone.free_from_fcfa is not null and v_subtotal >= v_zone.free_from_fcfa then 0
      else v_zone.fee_fcfa
    end;
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'subtotal_fcfa', v_subtotal,
    'delivery_fee_fcfa', v_delivery_fee,
    'total_fcfa', v_subtotal + v_delivery_fee,
    'zone_code', p_zone_code,
    'eta_label', v_eta,
    'valid', v_valid
  );
end;
$$;

revoke all on function private.compute_quote(jsonb, text) from public, anon, authenticated;

create function public.quote_cart(p_items jsonb, p_zone_code text default null)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.compute_quote(p_items, p_zone_code);
$$;

revoke all on function public.quote_cart(jsonb, text) from public, anon, authenticated;
grant execute on function public.quote_cart(jsonb, text) to anon, authenticated;
