create table public.brands (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,30}$'),
  name text not null unique,
  tagline text not null,
  position smallint not null default 0
);

create table public.categories (
  slug text primary key check (
    slug in ('smartphones', 'ecouteurs', 'montres', 'bracelets')
  ),
  name text not null,
  intro text not null default '',
  compare_group public.compare_group not null,
  position smallint not null default 0
);

create table public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]{2,12}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  brand_slug text not null references public.brands (slug) on update cascade,
  category_slug text not null references public.categories (slug) on update cascade,
  name text not null,
  tagline text not null,
  description text not null default '',
  visual_kind public.visual_kind not null,
  release_date date not null,
  new_until date,
  warranty_months smallint not null default 12 check (warranty_months between 0 and 36),
  compat text[] not null default '{}'
    check (compat <@ array['ios', 'android']::text[]),
  box_contents text[] not null default '{}',
  is_active boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.product_variants (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Z0-9-]{4,40}$'),
  color_name text not null,
  color_slug text not null check (color_slug ~ '^[a-z0-9-]{1,30}$'),
  color_hex text check (color_hex is null or color_hex ~ '^#[0-9A-F]{6}$'),
  storage_gb smallint check (storage_gb > 0),
  size_mm smallint check (size_mm between 20 and 60),
  price_fcfa integer not null check (price_fcfa between 1000 and 5000000),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold smallint not null default 3 check (low_stock_threshold >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  position smallint not null default 0,
  unique nulls not distinct (product_id, color_slug, storage_gb, size_mm)
);

create table public.product_images (
  id uuid primary key default extensions.gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_slug text,
  src text not null,
  storage_path text unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt text not null,
  is_primary boolean not null default false,
  position smallint not null default 0,
  credit text,
  source_url text
);

create table public.product_specs (
  product_id uuid primary key references public.products (id) on delete cascade,
  screen_size_in numeric(3, 2),
  screen_tech text,
  refresh_hz smallint,
  chip text,
  battery_mah integer,
  autonomy_hours integer,
  charging_w smallint,
  main_camera_mp smallint,
  weight_g numeric(5, 1),
  ip_rating text,
  has_5g boolean,
  has_anc boolean,
  specs_note text not null default 'Valeurs indicatives, projet pédagogique'
);

create table public.home_slots (
  id uuid primary key default extensions.gen_random_uuid(),
  slot public.home_slot_kind not null,
  position smallint not null,
  product_id uuid not null references public.products (id) on delete cascade,
  theme_key text not null default 'default',
  headline text,
  subline text,
  is_active boolean not null default true,
  unique (slot, position)
);

create index products_brand_slug_idx on public.products (brand_slug);
create index products_category_slug_idx on public.products (category_slug);
create index product_variants_product_id_idx on public.product_variants (product_id);
create unique index product_variants_default_idx
  on public.product_variants (product_id) where is_default;
create index product_images_product_position_idx
  on public.product_images (product_id, position);
create unique index product_images_primary_idx
  on public.product_images (product_id) where is_primary;
create index home_slots_product_id_idx on public.home_slots (product_id);
create index products_release_date_active_idx
  on public.products (release_date desc) where is_active;

create function private.products_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.new_until is null then
    new.new_until := new.release_date + 90;
  end if;
  return new;
end;
$$;

revoke all on function private.products_defaults() from public, anon, authenticated;
create trigger products_defaults
before insert or update of release_date, new_until on public.products
for each row execute function private.products_defaults();

create function private.variants_check_attributes()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  product_category text;
begin
  select products.category_slug
  into product_category
  from public.products as products
  where products.id = new.product_id;

  if product_category = 'smartphones' and new.storage_gb is null then
    raise exception 'Un smartphone doit préciser son stockage.'
      using errcode = '23514';
  end if;

  if product_category in ('ecouteurs', 'bracelets') and new.storage_gb is not null then
    raise exception 'Cette catégorie ne prend pas en charge le stockage.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.variants_check_attributes() from public, anon, authenticated;
create trigger variants_check_attributes
before insert or update of product_id, storage_gb on public.product_variants
for each row execute function private.variants_check_attributes();

create function private.products_activation_check()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active and (
    not exists (
      select 1
      from public.product_variants as variants
      where variants.product_id = new.id
        and variants.is_active
        and variants.is_default
    )
    or not exists (
      select 1
      from public.product_images as images
      where images.product_id = new.id
        and images.is_primary
    )
  ) then
    raise exception 'Un produit actif exige une variante par défaut et une image principale.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.products_activation_check() from public, anon, authenticated;
create trigger products_activation_check
before insert or update of is_active on public.products
for each row execute function private.products_activation_check();

create trigger products_set_updated_at
before update on public.products
for each row execute function private.set_updated_at();