create table public.delivery_zones (
  code text primary key check (code in ('lome', 'maritime', 'plateaux', 'centrale', 'kara', 'savanes')),
  label text not null,
  fee_fcfa integer not null check (fee_fcfa >= 0),
  free_from_fcfa integer check (free_from_fcfa is null or free_from_fcfa > 0),
  eta_label text not null,
  eta_min_days smallint,
  eta_max_days smallint,
  is_active boolean not null default true,
  position smallint not null default 0,
  check (eta_min_days is null or eta_min_days >= 0),
  check (eta_max_days is null or eta_max_days >= 0),
  check (
    eta_min_days is null
    or eta_max_days is null
    or eta_min_days <= eta_max_days
  )
);

create table public.shop_settings (
  id boolean primary key default true check (id),
  banner_text text not null,
  cod_max_fcfa integer not null default 500000 check (cod_max_fcfa > 0),
  payment_ttl_minutes smallint not null default 30
    check (payment_ttl_minutes between 1 and 1440),
  attempt_ttl_seconds smallint not null default 120
    check (attempt_ttl_seconds > 0),
  max_qty_per_line smallint not null default 5 check (max_qty_per_line between 1 and 5),
  max_orders_per_phone_hour smallint not null default 5 check (max_orders_per_phone_hour > 0),
  max_open_cod_per_phone smallint not null default 2 check (max_open_cod_per_phone > 0),
  max_orders_per_hour smallint not null default 60 check (max_orders_per_hour > 0)
);

alter table public.delivery_zones enable row level security;
alter table public.shop_settings enable row level security;

revoke all on public.delivery_zones, public.shop_settings from anon, authenticated;
grant select on public.delivery_zones, public.shop_settings to anon, authenticated;
grant insert, update on public.delivery_zones to authenticated;
grant update on public.shop_settings to authenticated;

create policy delivery_zones_select on public.delivery_zones
for select to anon, authenticated
using (is_active or (select private.is_admin()));
create policy delivery_zones_insert on public.delivery_zones
for insert to authenticated
with check ((select private.is_admin()));
create policy delivery_zones_update on public.delivery_zones
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy shop_settings_select on public.shop_settings
for select to anon, authenticated
using (true);
create policy shop_settings_update on public.shop_settings
for update to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

insert into public.delivery_zones (
  code, label, fee_fcfa, free_from_fcfa, eta_label, eta_min_days, eta_max_days, position
)
values
  ('lome', 'Lomé', 1500, 300000, 'Délai indicatif', null, null, 0),
  ('maritime', 'Région Maritime', 3500, null, 'Délai indicatif', null, null, 1),
  ('plateaux', 'Région des Plateaux', 3500, null, 'Délai indicatif', null, null, 2),
  ('centrale', 'Région Centrale', 5000, null, 'Délai indicatif', null, null, 3),
  ('kara', 'Région de la Kara', 5000, null, 'Délai indicatif', null, null, 4),
  ('savanes', 'Région des Savanes', 5000, null, 'Délai indicatif', null, null, 5)
on conflict (code) do update
set label = excluded.label,
    fee_fcfa = excluded.fee_fcfa,
    free_from_fcfa = excluded.free_from_fcfa,
    eta_label = excluded.eta_label,
    eta_min_days = excluded.eta_min_days,
    eta_max_days = excluded.eta_max_days,
    position = excluded.position;

insert into public.shop_settings (id, banner_text, cod_max_fcfa)
values (true, 'Projet pédagogique : aucune vente réelle ni aucun paiement encaissé.', 500000)
on conflict (id) do update
set banner_text = excluded.banner_text,
    cod_max_fcfa = excluded.cod_max_fcfa;