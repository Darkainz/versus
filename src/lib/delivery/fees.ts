import type { DeliveryZoneOption } from "@/config/policies";

/** Montant indicatif restant avant la gratuité ; le montant dû reste celui du devis serveur. */
export function amountUntilFreeDelivery(
  subtotalFcfa: number,
  zone: DeliveryZoneOption | undefined,
): number {
  if (zone?.free_from_fcfa == null) return 0;
  return Math.max(0, zone.free_from_fcfa - subtotalFcfa);
}
