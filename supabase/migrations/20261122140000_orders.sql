create sequence public.order_number_seq start with 101;
revoke all on sequence public.order_number_seq from public, anon, authenticated;

create function private.next_order_number()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'VS-' || pg_catalog.to_char(
    pg_catalog.now() at time zone 'Africa/Lome',
    'YYYY'
  ) || '-' || pg_catalog.lpad(
    pg_catalog.nextval('public.order_number_seq'::pg_catalog.regclass)::text,
    6,
    '0'
  );
$$;
revoke all on function private.next_order_number() from public, anon, authenticated;

create table public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  number text not null unique default private.next_order_number(),
  user_id uuid references public.profiles (id) on delete set null,
  idempotency_key uuid not null unique,
  access_token_hash bytea not null,
  status public.order_status not null,
  payment_method public.payment_method not null,
  payment_status public.payment_status not null,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null check (customer_phone ~ '^\+228[0-9]{8}$'),
  customer_email text check (customer_email is null or char_length(customer_email) <= 254),
  zone_code text not null references public.delivery_zones (code),
  city text not null check (char_length(pg_catalog.btrim(city)) between 1 and 100),
  district text not null check (char_length(pg_catalog.btrim(district)) between 1 and 100),
  landmark text not null check (char_length(pg_catalog.btrim(landmark)) between 1 and 200),
  instructions text check (instructions is null or char_length(instructions) <= 500),
  eta_label text not null,
  subtotal_fcfa integer not null check (subtotal_fcfa >= 0),
  shipping_fcfa integer not null check (shipping_fcfa >= 0),
  total_fcfa integer generated always as (subtotal_fcfa + shipping_fcfa) stored,
  fictitious_ack_at timestamptz not null,
  payment_deadline timestamptz,
  cash_collected_at timestamptz,
  cancel_reason text,
  anonymized_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  check (
    (payment_method = 'cash_on_delivery')
    = (payment_status in ('cash_due', 'cash_collected'))
  ),
  check (status <> 'pending_payment' or payment_deadline is not null)
);

create table public.order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  product_id uuid not null references public.products (id) on delete restrict,
  product_name text not null,
  variant_label text not null,
  sku text not null,
  unit_price_fcfa integer not null check (unit_price_fcfa > 0),
  quantity smallint not null check (quantity between 1 and 5),
  line_total_fcfa integer generated always as (unit_price_fcfa * quantity) stored,
  unique (order_id, variant_id)
);

create table public.order_transitions (
  from_status public.order_status not null,
  to_status public.order_status not null,
  actor public.order_actor not null,
  primary key (from_status, to_status, actor)
);

insert into public.order_transitions (from_status, to_status, actor)
values
  ('pending_payment', 'confirmed', 'system'),
  ('pending_payment', 'cancelled', 'customer'),
  ('pending_payment', 'cancelled', 'admin'),
  ('pending_payment', 'cancelled', 'system'),
  ('confirmed', 'preparing', 'admin'),
  ('confirmed', 'cancelled', 'customer'),
  ('confirmed', 'cancelled', 'admin'),
  ('preparing', 'shipped', 'admin'),
  ('preparing', 'cancelled', 'admin'),
  ('shipped', 'delivered', 'admin');

create table public.order_status_history (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor public.order_actor not null,
  actor_id uuid,
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default pg_catalog.now()
);

create table public.payment_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method public.payment_method not null check (method <> 'cash_on_delivery'),
  msisdn_masked text,
  reference text not null unique check (reference ~ '^SIM-(TM|FL|CB)-[A-Z0-9]{6}$'),
  outcome public.attempt_outcome not null default 'pending',
  created_at timestamptz not null default pg_catalog.now(),
  expires_at timestamptz not null,
  resolved_at timestamptz
);

create unique index payment_attempts_one_pending_per_order_idx
  on public.payment_attempts (order_id)
  where outcome = 'pending';

create table public.stock_movements (
  id bigint generated always as identity primary key,
  variant_id uuid not null references public.product_variants (id) on delete restrict,
  delta integer not null check (delta <> 0),
  reason public.stock_reason not null,
  stock_after integer not null check (stock_after >= 0),
  order_id uuid references public.orders (id) on delete set null,
  actor_id uuid,
  note text,
  created_at timestamptz not null default pg_catalog.now()
);

create table private.track_attempts (
  order_number text not null,
  attempted_at timestamptz not null default pg_catalog.now()
);

create table private.order_attempts (
  phone text not null,
  attempted_at timestamptz not null default pg_catalog.now()
);

revoke all on private.track_attempts, private.order_attempts from public, anon, authenticated;

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_customer_phone_idx on public.orders (customer_phone);
create index orders_payment_deadline_idx on public.orders (payment_deadline)
  where status = 'pending_payment';
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_status_history_order_created_idx
  on public.order_status_history (order_id, created_at);
create index payment_attempts_order_idx on public.payment_attempts (order_id);
create index stock_movements_variant_created_idx
  on public.stock_movements (variant_id, created_at desc);
create index track_attempts_number_time_idx
  on private.track_attempts (order_number, attempted_at);
create index order_attempts_phone_time_idx
  on private.order_attempts (phone, attempted_at);
create index order_attempts_time_idx on private.order_attempts (attempted_at);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function private.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_transitions enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.stock_movements enable row level security;

revoke all on public.orders, public.order_items, public.order_transitions,
  public.order_status_history, public.payment_attempts, public.stock_movements
  from anon, authenticated;

grant select on public.orders, public.order_items, public.order_status_history,
  public.payment_attempts to authenticated;
grant select on public.order_transitions to anon, authenticated;
grant select on public.stock_movements to authenticated;
create policy orders_select on public.orders
for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy order_items_select on public.order_items
for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy order_transitions_select on public.order_transitions
for select to anon, authenticated
using (true);

create policy order_status_history_select on public.order_status_history
for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_status_history.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy payment_attempts_select on public.payment_attempts
for select to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = payment_attempts.order_id
      and (orders.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

create policy stock_movements_select on public.stock_movements
for select to authenticated
using ((select private.is_admin()));
