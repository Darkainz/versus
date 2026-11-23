insert into public.brands (slug, name, tagline, position)
values
  ('apple', 'Apple', 'iPhone, AirPods et Apple Watch.', 0),
  ('samsung', 'Samsung', 'Galaxy A, Galaxy Buds et Galaxy Watch.', 1),
  ('xiaomi', 'Xiaomi', 'Redmi Note, Redmi Watch et Smart Band.', 2)
on conflict (slug) do update
set name = excluded.name,
    tagline = excluded.tagline,
    position = excluded.position;

insert into public.categories (slug, name, intro, compare_group, position)
values
  ('smartphones', 'Smartphones', 'iPhone, Galaxy et Redmi : trouvez le téléphone qui vous ressemble.', 'phones', 0),
  ('ecouteurs', 'Écouteurs', 'Un son qui vous suit, pour le travail comme pour vos déplacements.', 'audio', 1),
  ('montres', 'Montres', 'Vos notifications, votre santé et votre activité au poignet.', 'wearables', 2),
  ('bracelets', 'Bracelets connectés', 'L’essentiel du suivi quotidien, dans un format léger.', 'wearables', 3)
on conflict (slug) do update
set name = excluded.name,
    intro = excluded.intro,
    compare_group = excluded.compare_group,
    position = excluded.position;