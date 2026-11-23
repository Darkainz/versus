alter table public.carts
drop constraint carts_items_check;

alter table public.carts
add constraint carts_items_check
check (pg_catalog.jsonb_typeof(items) = 'array' and pg_catalog.jsonb_array_length(items) <= 20);
