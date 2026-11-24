create view public.catalog_products
with (security_invoker = true)
as
select
  products.id,
  products.code,
  products.slug,
  products.name,
  products.tagline,
  products.brand_slug,
  brands.name as brand_name,
  products.category_slug,
  categories.compare_group,
  products.visual_kind,
  products.release_date,
  products.new_until,
  products.warranty_months,
  products.compat,
  min(variants.price_fcfa) filter (where variants.is_active) as min_price_fcfa,
  max(variants.price_fcfa) filter (where variants.is_active) as max_price_fcfa,
  coalesce(sum(variants.stock) filter (where variants.is_active), 0) > 0 as in_stock,
  images.src as image_src,
  images.width as image_width,
  images.height as image_height,
  images.alt as image_alt
from public.products as products
join public.brands as brands on brands.slug = products.brand_slug
join public.categories as categories on categories.slug = products.category_slug
left join public.product_variants as variants on variants.product_id = products.id
left join public.product_images as images
  on images.product_id = products.id and images.is_primary
group by
  products.id,
  brands.name,
  categories.compare_group,
  images.src,
  images.width,
  images.height,
  images.alt;

revoke all on public.catalog_products from public, anon, authenticated;
grant select on public.catalog_products to anon, authenticated;