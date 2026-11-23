"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { routeFor } from "@/config/site";
import { updateCart } from "@/lib/cart/cart-store";
import { CHECKOUT_IDEMPOTENCY_STORAGE_KEY } from "@/lib/orders/idempotency";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders/labels";
import type { PaymentMethod } from "@/lib/orders/payment-methods";
import type { OrderView } from "@/lib/orders/order-view";

export function OrderConfirmation({
  number,
  method,
  paymentStatus,
  total,
  items,
}: {
  number: string;
  method: PaymentMethod;
  paymentStatus: OrderView["payment_status"];
  total: number;
  items: OrderView["items"];
}) {
  const trackingHref = routeFor("suivi");
  const shopHref = routeFor("boutique");

  useEffect(() => {
    updateCart({ type: "clear" });
    try {
      window.sessionStorage.removeItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
    } catch (error) {
      console.warn("La clé de commande fictive n’a pas pu être effacée.", error);
    }
  }, []);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <p className="text-sm font-semibold text-accent-ink">Commande simulée confirmée</p>
        <h2 className="mt-2 font-display text-2xl font-bold">{number}</h2>
        <p className="mt-4 text-muted">
          Aucun achat ni paiement réel n’a été effectué. Moyen de paiement :{" "}
          {PAYMENT_METHOD_LABELS[method]} ({PAYMENT_STATUS_LABELS[paymentStatus]}).
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {trackingHref ? (
            <Button href={trackingHref} prefetch={false} variant="secondary">
              Suivre cette commande
            </Button>
          ) : null}
          {shopHref ? (
            <Button href={shopHref} prefetch={false}>
              Continuer mes achats
            </Button>
          ) : null}
        </div>
      </section>
      <aside className="h-fit rounded-card border border-line-soft p-6">
        <h3 className="text-lg font-bold">Récapitulatif</h3>
        <ul className="mt-4 divide-y divide-line-soft">
          {items.map((item) => (
            <li
              key={`${item.sku ?? item.product_name}-${item.variant_label}`}
              className="flex justify-between gap-4 py-3 text-sm"
            >
              <span>
                {item.product_name} · {item.variant_label} × {item.quantity}
              </span>
              <Price amount={item.line_total_fcfa} />
            </li>
          ))}
        </ul>
        <div className="flex justify-between gap-4 border-t border-line-soft pt-4 font-semibold">
          <span>Total</span>
          <Price amount={total} size="lead" />
        </div>
      </aside>
    </div>
  );
}
