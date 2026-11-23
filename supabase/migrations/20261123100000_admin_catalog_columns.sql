revoke insert on public.product_variants from authenticated;
grant insert (
  product_id, sku, color_name, color_slug, color_hex, storage_gb, size_mm,
  price_fcfa, low_stock_threshold, is_default, is_active, position
) on public.product_variants to authenticated;
