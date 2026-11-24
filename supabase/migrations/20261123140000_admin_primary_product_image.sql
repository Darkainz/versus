create function public.admin_set_product_image_primary(
  p_image_id uuid,
  p_product_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product_id uuid;
  v_updated integer;
begin
  if not private.is_admin() then
    raise exception using errcode = 'P0001', message = 'VS_FORBIDDEN';
  end if;

  if p_image_id is null or p_product_id is null then
    raise exception using errcode = 'P0001', message = 'VS_INVALID';
  end if;

  select products.id
  into v_product_id
  from public.products as products
  where products.id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  perform 1
  from public.product_images as images
  where images.id = p_image_id
    and images.product_id = p_product_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  update public.product_images as images
  set is_primary = false
  where images.product_id = p_product_id
    and images.id <> p_image_id
    and images.is_primary;

  update public.product_images as images
  set is_primary = true
  where images.id = p_image_id
    and images.product_id = p_product_id;
  get diagnostics v_updated = row_count;

  if v_updated <> 1 then
    raise exception using errcode = 'P0001', message = 'VS_NOT_FOUND';
  end if;

  return true;
end;
$$;

revoke all on function public.admin_set_product_image_primary(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.admin_set_product_image_primary(uuid, uuid)
to authenticated;
