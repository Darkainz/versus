import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { routeFor } from "@/config/site";
import { getDeliveryZones } from "@/lib/cart/delivery-zones";

export const metadata: Metadata = {
  title: "Commande simulée",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const zones = await getDeliveryZones();
  const cartHref = routeFor("panier");
  if (!cartHref) throw new Error("La route du panier doit être livrée avec la commande.");

  return (
    <div className="wrap section">
      <Breadcrumb
        items={[
          { label: "Accueil", href: routeFor("accueil") },
          { label: "Panier", href: cartHref },
          { label: "Commande simulée" },
        ]}
      />
      <h1 className="mt-4 text-display-h2">Finaliser la commande</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Quatre étapes pour tester le parcours. Aucune vente, aucun encaissement et aucune donnée
        bancaire réelle.
      </p>
      <CheckoutForm zones={zones} cartHref={cartHref} />
    </div>
  );
}
