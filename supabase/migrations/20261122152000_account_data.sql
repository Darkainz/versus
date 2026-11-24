create table public.addresses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Domicile' check (char_length(pg_catalog.btrim(label)) between 1 and 60),
  recipient_name text not null check (char_length(pg_catalog.btrim(recipient_name)) between 2 and 120),
  phone text not null check (phone ~ '^\+228[0-9]{8}$'),
  zone_code text not null references public.delivery_zones (code),
  city text not null check (char_length(pg_catalog.btrim(city)) between 1 and 100),
  district text not null check (char_length(pg_catalog.btrim(district)) between 1 and 100),
  landmark text not null check (char_length(pg_catalog.btrim(landmark)) between 1 and 200),
  instructions text check (instructions is null or char_length(instructions) <= 500),
  is_default boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create unique index addresses_one_default_per_user_idx
  on public.addresses (user_id)
  where is_default;
create index addresses_user_idx on public.addresses (user_id);

create trigger addresses_set_updated_at
before update on public.addresses
for each row execute function private.set_updated_at();

alter table public.addresses enable row level security;
revoke all on public.addresses from anon, authenticated;
grant select, insert, update, delete on public.addresses to authenticated;

create policy addresses_select on public.addresses
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy addresses_insert on public.addresses
for insert to authenticated
with check (user_id = (select auth.uid()));

create policy addresses_update on public.addresses
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy addresses_delete on public.addresses
for delete to authenticated
using (user_id = (select auth.uid()));

create table public.carts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  items jsonb not null default '[]'::jsonb
    check (pg_catalog.jsonb_typeof(items) = 'array' and pg_catalog.jsonb_array_length(items) <= 10),
  updated_at timestamptz not null default pg_catalog.now()
);

create trigger carts_set_updated_at
before update on public.carts
for each row execute function private.set_updated_at();

alter table public.carts enable row level security;
revoke all on public.carts from anon, authenticated;
grant select, insert, update, delete on public.carts to authenticated;

create policy carts_owner_all on public.carts
for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
