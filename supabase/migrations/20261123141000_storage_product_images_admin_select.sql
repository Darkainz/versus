create policy "product_images_admin_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
);
