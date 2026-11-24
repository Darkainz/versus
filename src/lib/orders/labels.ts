import type { OrderStatus } from "./transitions";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: "En attente de paiement",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const PAYMENT_METHOD_LABELS = {
  tmoney: "T-Money",
  flooz: "Flooz",
  card: "Carte bancaire simulée",
  cash_on_delivery: "Paiement à la livraison",
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: "En attente",
  succeeded: "Paiement simulé validé",
  failed: "Paiement refusé",
  expired: "Délai de paiement dépassé",
  cash_due: "À régler à la livraison",
  cash_collected: "Réglée à la livraison",
} as const;
