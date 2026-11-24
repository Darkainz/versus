"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { initialTrackingActionState } from "@/lib/orders/action-state";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders/labels";
import { orderErrorMessage } from "@/lib/orders/errors";
import { trackOrder } from "@/server/actions/checkout";

export function OrderTrackingForm() {
  const [state, action, pending] = useActionState(trackOrder, initialTrackingActionState);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <form
        action="/suivi"
        method="post"
        className="h-fit rounded-card border border-line-soft p-6"
      >
        <div className="grid gap-5">
          <Field id="number" label="Numéro de commande" hint="Exemple : VS-2026-000101." required>
            <input
              id="number"
              name="number"
              required
              autoComplete="off"
              pattern="VS-[0-9]{4}-[0-9]{6}"
              className="min-h-12 rounded-option border border-line bg-bg px-3 font-mono font-normal"
            />
          </Field>
          <Field id="phone" label="Téléphone utilisé à la commande" required>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              required
              maxLength={24}
              placeholder="+228 90 12 34 56"
              className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
            />
          </Field>
          <p className="text-sm text-muted">
            Le numéro sert à vérifier l’accès. Il n’apparaît pas dans l’adresse de cette page.
          </p>
          <Button type="submit" formAction={action} disabled={pending}>
            {pending ? "Recherche…" : "Rechercher la commande"}
          </Button>
        </div>
        {state.error ? (
          <p
            role="alert"
            className="mt-4 rounded-option border border-danger bg-surface p-4 text-sm"
          >
            {orderErrorMessage(state.error)}
          </p>
        ) : null}
      </form>

      {state.order ? (
        <section
          aria-labelledby="tracking-result-title"
          className="rounded-card border border-line-soft p-6"
        >
          <h2 id="tracking-result-title" className="text-xl font-bold">
            {state.order.number}
          </h2>
          <p className="mt-3 font-semibold">{ORDER_STATUS_LABELS[state.order.status]}</p>
          <p className="mt-1 text-sm text-muted">
            Paiement : {PAYMENT_STATUS_LABELS[state.order.payment_status]}
          </p>
          <p className="mt-1 text-sm text-muted">
            Livraison à {state.order.city} · {state.order.eta_label}
          </p>
          <h3 className="mt-6 font-semibold">Articles</h3>
          <ul className="mt-2 divide-y divide-line-soft">
            {state.order.items.map((item, index) => (
              <li
                key={`${item.product_name}-${item.variant_label}-${index}`}
                className="flex justify-between gap-4 py-3 text-sm"
              >
                <span>
                  {item.product_name} · {item.variant_label} × {item.quantity}
                </span>
                <Price amount={item.line_total_fcfa} />
              </li>
            ))}
          </ul>
          <h3 className="mt-6 font-semibold">Historique</h3>
          <ol className="mt-3 grid gap-3">
            {state.order.history.map((entry, index) => (
              <li key={`${entry.created_at}-${index}`} className="border-l-2 border-line-soft pl-4">
                <p className="font-medium">{ORDER_STATUS_LABELS[entry.to_status]}</p>
                <time dateTime={entry.created_at} className="text-sm text-muted">
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Africa/Lome",
                  }).format(new Date(entry.created_at))}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="text-sm text-muted">
          Après une commande simulée, son état et ses étapes de suivi s’afficheront ici.
        </p>
      )}
    </div>
  );
}
