-- Le panier existant attend ces champs pour afficher la variante, la vignette et la zone choisie.
-- Migration additive : elle remplace uniquement le corps de la fonction déjà publiée.

create or replace function private.compute_quote(p_items jsonb, p_zone_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_line record;
  v_variant record;
  v_image record;
  v_settings record;
  v_zone record;
  v_lines jsonb := '[]'::jsonb;
  v_issues text[];
  v_qty integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_delivery_fee integer := 0;
  v_zone_label text;
  v_eta_label text;
  v_valid boolean := true;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 100 then
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
    select code, label, fee_fcfa, free_from_fcfa, eta_label
    into v_zone
    from public.delivery_zones
    where code = p_zone_code and is_active;
    if not found then
      raise exception using errcode = 'P0001', message = 'VS_INVALID_ZONE';
    end if;
    v_zone_label := v_zone.label;
    v_eta_label := v_zone.eta_label;
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
    select
      variants.sku,
      variants.color_name,
      variants.color_slug,
      variants.color_hex,
      variants.price_fcfa,
      variants.stock,
      variants.is_active,
      products.id as product_id,
      products.is_active as product_active,
      products.name,
      products.slug,
      products.brand_slug,
      products.visual_kind
    into v_variant
    from public.product_variants as variants
    join public.products as products on products.id = variants.product_id
    where variants.sku = v_line.sku;

    v_issues := array[]::text[];
    v_qty := least(v_line.requested_qty, v_settings.max_qty_per_line);
    if v_line.requested_qty > v_settings.max_qty_per_line then
      v_issues := array_append(v_issues, 'qty_capped');
    end if;

    if not found then
      v_issues := array_append(v_issues, 'unavailable');
      v_valid := false;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'sku', v_line.sku,
        'name', coalesce(v_variant.name, v_line.sku),
        'slug', v_variant.slug,
        'variant_label', v_variant.color_name,
        'color_hex', v_variant.color_hex,
        'brand_slug', v_variant.brand_slug,
        'visual_kind', v_variant.visual_kind,
        'image_src', null,
        'image_width', null,
        'image_height', null,
        'qty', v_qty,
        'stock', 0,
        'price_fcfa', null,
        'line_total_fcfa', 0,
        'issues', to_jsonb(v_issues)
      ));
      continue;
    end if;

    if not v_variant.is_active or not v_variant.product_active then
      v_issues := array_append(v_issues, 'unavailable');
      v_valid := false;
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'sku', v_line.sku,
        'name', v_variant.name,
        'slug', v_variant.slug,
        'variant_label', v_variant.color_name,
        'color_hex', v_variant.color_hex,
        'brand_slug', v_variant.brand_slug,
        'visual_kind', v_variant.visual_kind,
        'image_src', null,
        'image_width', null,
        'image_height', null,
        'qty', v_qty,
        'stock', 0,
        'price_fcfa', null,
        'line_total_fcfa', 0,
        'issues', to_jsonb(v_issues)
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

    select images.src, images.width, images.height
    into v_image
    from public.product_images as images
    where images.product_id = v_variant.product_id
      and (images.color_slug = v_variant.color_slug or images.is_primary)
    order by (images.color_slug = v_variant.color_slug) desc, images.is_primary desc, images.position
    limit 1;

    v_line_total := v_variant.price_fcfa * v_qty;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'sku', v_variant.sku,
      'name', v_variant.name,
      'slug', v_variant.slug,
      'variant_label', v_variant.color_name,
      'color_hex', v_variant.color_hex,
      'brand_slug', v_variant.brand_slug,
      'visual_kind', v_variant.visual_kind,
      'image_src', v_image.src,
      'image_width', v_image.width,
      'image_height', v_image.height,
      'qty', v_qty,
      'stock', v_variant.stock,
      'price_fcfa', v_variant.price_fcfa,
      'line_total_fcfa', v_line_total,
      'issues', to_jsonb(v_issues)
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
    'zone_label', v_zone_label,
    'eta_label', v_eta_label,
    'valid', v_valid
  );
end;
$$;

revoke all on function private.compute_quote(jsonb, text) from public, anon, authenticated;

update public.delivery_zones
set
  label = case code
    when 'lome' then 'Lomé et environs'
    when 'maritime' then 'Région Maritime'
    when 'plateaux' then 'Région des Plateaux'
    when 'centrale' then 'Région Centrale'
    when 'kara' then 'Région de la Kara'
    when 'savanes' then 'Région des Savanes'
  end,
  eta_label = case code
    when 'lome' then '24 à 48 h'
    when 'maritime' then '2 à 4 jours ouvrés'
    when 'plateaux' then '2 à 4 jours ouvrés'
    when 'centrale' then '3 à 6 jours ouvrés'
    when 'kara' then '3 à 6 jours ouvrés'
    when 'savanes' then '3 à 6 jours ouvrés'
  end;

create or replace function public.quote_cart(p_items jsonb, p_zone_code text default null)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.compute_quote(p_items, p_zone_code);
$$;

revoke all on function public.quote_cart(jsonb, text) from public, anon, authenticated;
grant execute on function public.quote_cart(jsonb, text) to anon, authenticated;
