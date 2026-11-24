export const ORDER_ERROR_MESSAGES = {
  VS_ACK_REQUIRED: "Confirmez que cette commande est entièrement fictive.",
  VS_ATTEMPT_RESOLVED: "Cette tentative est déjà terminée. Lancez une nouvelle simulation.",
  VS_COD_CAP: "Le paiement à la livraison n'est pas disponible pour ce montant.",
  VS_EXPIRED: "Le délai de paiement est dépassé. La commande a été annulée.",
  VS_INVALID: "Vérifiez les informations saisies puis réessayez.",
  VS_INVALID_ZONE: "Cette zone de livraison n'est plus disponible.",
  VS_NOT_FOUND: "Commande introuvable.",
  VS_NOT_PAYABLE: "Cette commande ne peut plus être payée.",
  VS_OUT_OF_STOCK: "Le stock a changé. Vérifiez votre panier.",
  VS_PAYMENT_FAILED: "Le paiement simulé a été refusé. Vous pouvez réessayer.",
  VS_RATE_LIMITED: "Trop de commandes avec ce numéro, réessayez plus tard.",
  VS_REFERENCE_FAILED: "Impossible de préparer la simulation. Réessayez.",
  VS_UNAVAILABLE: "Le service est momentanément indisponible. Réessayez.",
} as const;

export type OrderErrorCode = keyof typeof ORDER_ERROR_MESSAGES;

export function orderErrorMessage(code: OrderErrorCode, sku?: string): string {
  if (code === "VS_OUT_OF_STOCK" && sku) {
    return `Le stock de ${sku} a changé. Vérifiez votre panier.`;
  }
  return ORDER_ERROR_MESSAGES[code];
}
