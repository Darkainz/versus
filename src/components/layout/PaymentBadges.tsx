import { site } from "@/config/site";

/**
 * Moyens de paiement présentés dans le pied de page (refonte §3.5 : simple liste de texte, pas
 * de badges). Tous sont simulés : aucun champ de carte, aucun code PIN, aucun encaissement
 * (principe 7).
 */
export function PaymentBadges() {
  return (
    <p className="mt-[18px] text-xs leading-[1.6]">
      {site.payments.join(" · ")} <span className="text-muted">(simulés)</span>
    </p>
  );
}
