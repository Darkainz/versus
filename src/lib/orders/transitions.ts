export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TRANSITIONS = [
  { from: "pending_payment", to: "confirmed", actor: "system" },
  { from: "pending_payment", to: "cancelled", actor: "customer" },
  { from: "pending_payment", to: "cancelled", actor: "admin" },
  { from: "pending_payment", to: "cancelled", actor: "system" },
  { from: "confirmed", to: "preparing", actor: "admin" },
  { from: "confirmed", to: "cancelled", actor: "customer" },
  { from: "confirmed", to: "cancelled", actor: "admin" },
  { from: "preparing", to: "shipped", actor: "admin" },
  { from: "preparing", to: "cancelled", actor: "admin" },
  { from: "shipped", to: "delivered", actor: "admin" },
] as const satisfies readonly {
  from: OrderStatus;
  to: OrderStatus;
  actor: "customer" | "admin" | "system";
}[];
