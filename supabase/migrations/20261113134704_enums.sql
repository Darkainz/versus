create type public.user_role as enum ('admin');
create type public.compare_group as enum ('phones', 'audio', 'wearables');
create type public.visual_kind as enum ('phone', 'watch', 'round', 'band', 'buds');
create type public.home_slot_kind as enum ('hero', 'tile', 'rail', 'compare');
create type public.order_status as enum (
  'pending_payment',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled'
);
create type public.order_actor as enum ('customer', 'admin', 'system');
create type public.payment_method as enum ('tmoney', 'flooz', 'card', 'cash_on_delivery');
create type public.payment_status as enum (
  'pending',
  'succeeded',
  'failed',
  'expired',
  'cash_due',
  'cash_collected'
);
create type public.attempt_outcome as enum ('pending', 'succeeded', 'failed', 'expired');
create type public.stock_reason as enum (
  'order',
  'order_cancelled',
  'restock',
  'correction',
  'damage'
);