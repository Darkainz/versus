create or replace function public.admin_update_product_variant(
  p_variant_id uuid,
  p_product_id uuid,
  p_sku text,
  p_color_name text,
  p_color_slug text,
  p_price_fcfa integer,
  p_low_stock_threshold smallint,
  p_is_default boolean,
  p_is_active boolean,
  p_color_hex text default null,
  p_storage_gb smallint default null,
  p_size_mm smallint default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_active boolean;
  v_variant_is_default boolean;
  v_updated integer;
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;

  if p_variant_id is null
    or p_product_id is null
    or p_sku is null
    or p_sku !~ '^[A-Z0-9-]{4,40}$'
    or p_color_name is null
    or pg_catalog.btrim(p_color_name) = ''
    or pg_catalog.char_length(p_color_name) > 60
    or p_color_slug is null
    or p_color_slug !~ '^[a-z0-9-]{1,30}$'
    or (p_color_hex is not null and p_color_hex !~ '^#[0-9A-F]{6}$')
    or (p_storage_gb is not null and p_storage_gb <= 0)
    or (p_size_mm is not null and p_size_mm not between 20 and 60)
    or p_price_fcfa is null
    or p_price_fcfa not between 1000 and 5000000
    or p_low_stock_threshold is null
    or p_low_stock_threshold < 0
    or p_is_default is null
    or p_is_active is null
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select products.is_active
  into v_product_active
  from public.products as products
  where products.id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  select variants.is_default
  into v_variant_is_default
  from public.product_variants as variants
  where variants.id = p_variant_id
    and variants.product_id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  if v_product_active and (
    (p_is_default and not p_is_active)
    or (v_variant_is_default and (not p_is_active or not p_is_default))
  )
  then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  if p_is_default then
    update public.product_variants as variants
    set is_default = false
    where variants.product_id = p_product_id
      and variants.id <> p_variant_id
      and variants.is_default;
  end if;

  update public.product_variants as variants
  set sku = p_sku,
      color_name = pg_catalog.btrim(p_color_name),
      color_slug = p_color_slug,
      color_hex = p_color_hex,
      storage_gb = p_storage_gb,
      size_mm = p_size_mm,
      price_fcfa = p_price_fcfa,
      low_stock_threshold = p_low_stock_threshold,
      is_default = p_is_default,
      is_active = p_is_active
  where variants.id = p_variant_id
    and variants.product_id = p_product_id;
  get diagnostics v_updated = row_count;

  if v_updated <> 1 then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  return true;
end;
$$;
