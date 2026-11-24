alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.product_specs enable row level security;
alter table public.home_slots enable row level security;

revoke all on public.brands, public.categories, public.products,
  public.product_variants, public.product_images, public.product_specs,
  public.home_slots from anon, authenticated;

grant select on public.brands, public.categories, public.products,
  public.product_variants, public.product_images, public.product_specs,
  public.home_slots to anon;
grant select, insert, update on public.brands, public.categories, public.products
  to authenticated;
grant select, insert on public.product_variants to authenticated;
grant update (
  product_id, sku, color_name, color_slug, color_hex, storage_gb, size_mm,
  price_fcfa, low_stock_threshold, is_default, is_active, position
) on public.product_variants to authenticated;
grant select, insert, update, delete on public.product_images,
  public.product_specs, public.home_slots to authenticated;

create policy brands_select on public.brands
for select to anon, authenticated
using (true);
create policy brands_insert on public.brands
for insert to authenticated
with check ((select private.is_admin()));
create policy brands_update on public.brands
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy categories_select on public.categories
for select to anon, authenticated
using (true);
create policy categories_insert on public.categories
for insert to authenticated
with check ((select private.is_admin()));
create policy categories_update on public.categories
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy products_select on public.products
for select to anon, authenticated
using (is_active or (select private.is_admin()));
create policy products_insert on public.products
for insert to authenticated
with check ((select private.is_admin()));
create policy products_update on public.products
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy product_variants_select on public.product_variants
for select to anon, authenticated
using (
  (is_active and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.is_active
  ))
  or (select private.is_admin())
);
create policy product_variants_insert on public.product_variants
for insert to authenticated
with check ((select private.is_admin()));
create policy product_variants_update on public.product_variants
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy product_images_select on public.product_images
for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active
  )
  or (select private.is_admin())
);
create policy product_images_insert on public.product_images
for insert to authenticated
with check ((select private.is_admin()));
create policy product_images_update on public.product_images
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy product_images_delete on public.product_images
for delete to authenticated
using ((select private.is_admin()));

create policy product_specs_select on public.product_specs
for select to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_specs.product_id
      and products.is_active
  )
  or (select private.is_admin())
);
create policy product_specs_insert on public.product_specs
for insert to authenticated
with check ((select private.is_admin()));
create policy product_specs_update on public.product_specs
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy product_specs_delete on public.product_specs
for delete to authenticated
using ((select private.is_admin()));

create policy home_slots_select on public.home_slots
for select to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.products
    where products.id = home_slots.product_id
      and products.is_active
  )
  or (select private.is_admin())
);
create policy home_slots_insert on public.home_slots
for insert to authenticated
with check ((select private.is_admin()));
create policy home_slots_update on public.home_slots
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
create policy home_slots_delete on public.home_slots
for delete to authenticated
using ((select private.is_admin()));