begin;

select plan(7);

select is(
  (public.quote_cart('[{"sku":"AP5-BLA","qty":1,"price_fcfa":1}]'::jsonb)->>'subtotal_fcfa')::integer,
  95000,
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
  (public.quote_cart('[{"sku":"AP5-BLA","qty":1}]'::jsonb, 'lome')->>'delivery_fee_fcfa')::integer,
  1500,
  'Lomé applique le tarif de livraison approuvé'
);

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
