"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { Stepper } from "@/components/ui/Stepper";
import { FictionNotice } from "./FictionNotice";
import type { DeliveryZoneOption } from "@/config/policies";
import { setCartZone } from "@/lib/cart/cart-store";
import { useCart } from "@/lib/cart/use-cart";
import { amountUntilFreeDelivery } from "@/lib/delivery/fees";
import { CHECKOUT_IDEMPOTENCY_STORAGE_KEY } from "@/lib/orders/idempotency";
import { MAX_ORDER_LINES } from "@/lib/orders/limits";
import { orderErrorMessage } from "@/lib/orders/errors";
import { initialCheckoutActionState } from "@/lib/orders/action-state";
import { placeOrder } from "@/server/actions/checkout";
import { useCartQuote } from "@/components/cart/use-cart-quote";
import { CustomerStep, DeliveryStep, PaymentStep, ReviewStep } from "./CheckoutSteps";

const steps = ["Coordonnées", "Livraison", "Paiement", "Vérification"] as const;

function getIdempotencyKey(): string {
  const stored = window.sessionStorage.getItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY);
  if (
    stored &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)
  ) {
    return stored;
  }
  const key = crypto.randomUUID();
  window.sessionStorage.setItem(CHECKOUT_IDEMPOTENCY_STORAGE_KEY, key);
  return key;
}

export function CheckoutForm({
  zones,
  cartHref,
}: {
  zones: readonly DeliveryZoneOption[];
  cartHref: string;
}) {
  const cart = useCart();
  const quote = useCartQuote(cart);
  const [step, setStep] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [idempotencyError, setIdempotencyError] = useState(false);
  const [state, action, pending] = useActionState(placeOrder, initialCheckoutActionState);
  const formRef = useRef<HTMLFormElement>(null);

  const validateStep = (): boolean => {
    const fieldset = formRef.current?.querySelector<HTMLElement>(`[data-checkout-step="${step}"]`);
    if (!fieldset) return false;
    const invalid = Array.from(
      fieldset.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea",
      ),
    ).find((field) => !field.checkValidity());
    if (!invalid) return true;
    invalid.reportValidity();
    return false;
  };

  const advanceStep = () => {
    if (!validateStep()) return;
    if (!idempotencyKey) {
      try {
        setIdempotencyKey(getIdempotencyKey());
        setIdempotencyError(false);
      } catch (error) {
        console.error("La clé d’idempotence ne peut pas être conservée dans cet onglet.", error);
        setIdempotencyError(true);
        return;
      }
    }
    setStep((current) => current + 1);
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    if (step < steps.length - 1) {
      event.preventDefault();
      advanceStep();
    } else if (!validateStep()) {
      event.preventDefault();
    }
  }

  if (!cart) {
    return <p className="mt-6 text-muted">Chargement du panier…</p>;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-line-soft p-6">
        <p>Votre panier est vide. Ajoutez un article avant de passer commande.</p>
        <Button href={cartHref} prefetch={false} className="mt-5">
          Retour au panier
        </Button>
      </div>
    );
  }

  if (cart.lines.length > MAX_ORDER_LINES) {
    return (
      <div className="mt-8 rounded-card border border-line-soft p-6">
        <p>
          Une commande simulée peut contenir au maximum {MAX_ORDER_LINES} variantes. Réduisez le
          nombre de lignes de votre panier pour continuer.
        </p>
        <Button href={cartHref} prefetch={false} variant="secondary" className="mt-5">
          Corriger le panier
        </Button>
      </div>
    );
  }

  const selectedZone = zones.find((zone) => zone.code === cart.zone);
  const quoteReady =
    Boolean(quote.quote?.valid) &&
    !quote.pending &&
    !quote.error &&
    quote.quote?.zone_code === cart.zone;
  const remaining =
    selectedZone && quote.quote
      ? amountUntilFreeDelivery(quote.quote.subtotal_fcfa, selectedZone)
      : 0;

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="checkout-form-title">
        <h2 id="checkout-form-title" className="sr-only">
          Informations de commande
        </h2>
        <Stepper steps={steps} current={step} />
        <div className="mt-6">
          <FictionNotice />
        </div>
        <form ref={formRef} action={action} onSubmit={submit} noValidate className="mt-8">
          <input type="hidden" name="items" value={JSON.stringify(cart.lines)} />
          <input type="hidden" name="idempotency_key" value={idempotencyKey} />
          <fieldset hidden={step !== 0} data-checkout-step="0" className="grid gap-6 border-0 p-0">
            <legend className="mb-5 text-xl font-bold">Vos coordonnées</legend>
            <CustomerStep />
          </fieldset>
          <fieldset hidden={step !== 1} data-checkout-step="1" className="grid gap-6 border-0 p-0">
            <legend className="mb-5 text-xl font-bold">Adresse de livraison</legend>
            <DeliveryStep zones={zones} selectedZone={cart.zone ?? ""} onZoneChange={setCartZone} />
          </fieldset>
          <fieldset hidden={step !== 2} data-checkout-step="2" className="grid gap-6 border-0 p-0">
            <legend className="mb-5 text-xl font-bold">Moyen de paiement</legend>
            <PaymentStep />
          </fieldset>
          <fieldset hidden={step !== 3} data-checkout-step="3" className="grid gap-6 border-0 p-0">
            <legend className="mb-5 text-xl font-bold">Vérifiez votre commande</legend>
            <ReviewStep />
          </fieldset>

          {state.error ? (
            <p
              role="alert"
              className="mt-5 rounded-option border border-danger bg-surface p-4 text-sm"
            >
              {orderErrorMessage(state.error, state.sku)}
            </p>
          ) : null}
          {idempotencyError ? (
            <p
              role="alert"
              className="mt-5 rounded-option border border-danger bg-surface p-4 text-sm"
            >
              Le stockage de session est nécessaire pour éviter les commandes en double. Activez-le
              puis réessayez.
            </p>
          ) : null}
          {quote.error ? (
            <p
              role="alert"
              className="mt-5 rounded-option border border-danger bg-surface p-4 text-sm"
            >
              Le devis ne peut pas être vérifié.{" "}
              <button type="button" className="font-semibold underline" onClick={quote.retry}>
                Réessayer
              </button>
            </p>
          ) : null}
          {quote.quote && !quote.quote.valid ? (
            <p
              role="alert"
              className="mt-5 rounded-option border border-danger bg-surface p-4 text-sm"
            >
              Le stock d’un article a changé.{" "}
              <Button href={cartHref} prefetch={false} variant="secondary" className="mt-2">
                Corriger le panier
              </Button>
            </p>
          ) : null}
          {quote.quote && !quote.quote.valid ? (
            <p
              role="alert"
              className="mt-5 rounded-option border border-danger bg-surface p-4 text-sm"
            >
              Le stock d’un article a changé. Revenez au panier pour corriger les quantités avant de
              continuer.
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep((current) => current - 1)}>
                Retour
              </Button>
            ) : (
              <Button href={cartHref} prefetch={false} variant="secondary">
                Modifier le panier
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={advanceStep}>Continuer</Button>
            ) : (
              <Button
                type="submit"
                disabled={pending || !idempotencyKey || !cart.zone || !quoteReady}
              >
                {pending ? "Enregistrement…" : "Confirmer la commande fictive"}
              </Button>
            )}
          </div>
        </form>
      </section>

      <aside
        aria-labelledby="checkout-summary-title"
        className="h-fit rounded-card border border-line-soft p-6"
      >
        <h2 id="checkout-summary-title" className="mb-5 text-lg font-bold">
          Récapitulatif
        </h2>
        <ul className="mb-5 space-y-3">
          {cart.lines.map((line) => {
            const item = quote.quote?.lines.find((entry) => entry.sku === line.sku);
            return (
              <li key={line.sku} className="flex justify-between gap-4 text-sm">
                <span>
                  {item
                    ? `${item.name}${item.variant_label ? ` · ${item.variant_label}` : ""}`
                    : line.sku}{" "}
                  × {line.qty}
                </span>
                <span>{item ? <Price amount={item.line_total_fcfa} /> : "…"}</span>
              </li>
            );
          })}
        </ul>
        <dl className="space-y-3 border-t border-line-soft pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Sous-total</dt>
            <dd>{quote.quote ? <Price amount={quote.quote.subtotal_fcfa} /> : "…"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Livraison {selectedZone ? `· ${selectedZone.label}` : ""}</dt>
            <dd>
              {quote.quote ? (
                quote.quote.delivery_fee_fcfa === 0 ? (
                  "Offerte"
                ) : (
                  <Price amount={quote.quote.delivery_fee_fcfa} />
                )
              ) : (
                "À choisir"
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-line-soft pt-4 font-semibold">
            <dt>Total</dt>
            <dd>{quote.quote ? <Price amount={quote.quote.total_fcfa} size="lead" /> : "…"}</dd>
          </div>
        </dl>
        {remaining > 0 ? (
          <p className="mt-3 text-sm text-muted">
            Encore <Price amount={remaining} /> pour la livraison offerte.
          </p>
        ) : null}
        {quote.pending ? <p className="mt-3 text-sm text-muted">Mise à jour des prix…</p> : null}
        <p className="mt-5 text-xs text-muted">
          Projet pédagogique : aucune vente ni aucun paiement réel.
        </p>
      </aside>
    </div>
  );
}
