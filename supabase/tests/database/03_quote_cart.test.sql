begin;

select plan(11);

select is(
  (public.quote_cart('[{"sku":"AP5-BLA","qty":1,"price_fcfa":1}]'::jsonb)->>'subtotal_fcfa')::integer,
  98000,
  'le total utilise toujours le prix de la base'
);

select is(
  jsonb_typeof(
    public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb)->'lines'->0->'slug'
  ),
  'string',
  'le devis expose le slug du produit pour son lien'
);

select is(
  jsonb_build_object(
    'variant_label', quote->'lines'->0->'variant_label',
    'color_hex', quote->'lines'->0->'color_hex',
    'brand_slug', quote->'lines'->0->'brand_slug',
    'visual_kind', quote->'lines'->0->'visual_kind'
  ),
  '{"variant_label":"Blanc","color_hex":"#FFFFFF","brand_slug":"apple","visual_kind":"buds"}'::jsonb,
  'le devis expose les informations de variante attendues'
)
from (
  select public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb) as quote
) as result;

select is(
  jsonb_build_object(
    'image_src', quote->'lines'->0->'image_src',
    'image_width', quote->'lines'->0->'image_width',
    'image_height', quote->'lines'->0->'image_height'
  ),
  '{"image_src":"/products/ap5.png","image_width":620,"image_height":879}'::jsonb,
  'le devis expose la vignette du produit'
)
from (
  select public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb) as quote
) as result;

select is(
  (public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb, 'lome')->>'delivery_fee_fcfa')::integer,
  1500,
  'Lomé applique le tarif de livraison approuvé'
);

select is(
  jsonb_build_object(
    'zone_label', quote->'zone_label',
    'eta_label', quote->'eta_label'
  ),
  '{"zone_label":"Lomé et environs","eta_label":"24 à 48 h"}'::jsonb,
  'le devis expose le nom et le délai de la zone'
)
from (
  select public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb, 'lome') as quote
) as result;

select is(
  jsonb_array_length(public.quote_cart(
    '[{"sku":"AP5-BLA","qty":1},{"sku":"AP5-BLA","qty":1}]'::jsonb
  )->'lines'),
  1,
  'les lignes répétées par SKU sont agrégées'
);

select is(
  (public.quote_cart(
    '[{"sku":"IP18-BOR-256","qty":1}]'::jsonb
  )->'lines'->0->'issues') @> '["insufficient_stock"]'::jsonb,
  true,
  'une variante en rupture est signalée'
);

select ok(
  (quote->>'valid')::boolean = false
    and quote->'lines'->0->'issues' @> '["unavailable"]'::jsonb
    and quote->'lines'->0->'slug' = 'null'::jsonb,
  'un SKU inconnu renvoie une ligne indisponible sans slug'
)
from (
  select public.quote_cart('[{"sku":"SKU-ABSENT","qty":1}]'::jsonb) as quote
) as result;

select throws_ok(
  $$select public.quote_cart('[{"sku":"AP5-BLA","qty":0}]'::jsonb)$$,
  'P0001',
  'VS_INVALID',
  'une quantité invalide est refusée'
);

select throws_ok(
  $$select public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb, 'unknown-zone')$$,
  'P0001',
  'VS_INVALID_ZONE',
  'une zone invalide est refusée'
);

select * from finish();
rollback;
