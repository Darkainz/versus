"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { orderErrorMessage } from "@/lib/orders/errors";
import { PAYMENT_METHOD_LABELS } from "@/lib/orders/labels";
import type { PaymentMethod } from "@/lib/orders/payment-methods";
import type { OrderView } from "@/lib/orders/order-view";
import { initialPaymentActionState } from "@/lib/orders/action-state";
import { resolvePayment, startPayment } from "@/server/actions/checkout";

type PaymentAttempt = OrderView["payment_attempt"];

export function PaymentSimulator({
  number,
  total,
  paymentMethod,
  paymentDeadline,
  attempt,
  status,
}: {
  number: string;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDeadline: string | null;
  attempt: PaymentAttempt;
  status: OrderView["status"];
}) {
  const [startState, startAction, startPending] = useActionState(
    startPayment,
    initialPaymentActionState,
  );
  const [resolveState, resolveAction, resolvePending] = useActionState(
    resolvePayment,
    initialPaymentActionState,
  );
  const [clock, setClock] = useState<{ expiresAt: string; seconds: number } | null>(null);

  useEffect(() => {
    if (!attempt || attempt.outcome !== "pending") return;
    const timer = window.setInterval(() => {
      setClock({
        expiresAt: attempt.expires_at,
        seconds: Math.max(0, Math.ceil((Date.parse(attempt.expires_at) - Date.now()) / 1000)),
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  const remaining =
    attempt?.outcome === "pending"
      ? clock?.expiresAt === attempt.expires_at
        ? clock.seconds
        : null
      : 0;
  const pendingAttempt = attempt?.outcome === "pending" && (remaining === null || remaining > 0);

  if (status === "cancelled") {
    return (
      <p className="mt-6 rounded-option bg-surface p-4">
        Cette commande est annulée. Le stock réservé a été remis à disposition.
      </p>
    );
  }

  return (
    <div className="mt-8 grid gap-6">
      <section className="rounded-card border border-line-soft p-6">
        <h2 className="text-lg font-bold">Montant à régler</h2>
        <p className="mt-2">
          <Price amount={total} size="lead" />
        </p>
        {paymentDeadline ? (
          <p className="mt-3 text-sm text-muted">
            Le paiement doit être simulé avant le{" "}
            <time dateTime={paymentDeadline}>
              {new Intl.DateTimeFormat("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
                timeZone: "Africa/Lome",
              }).format(new Date(paymentDeadline))}
            </time>
            .
          </p>
        ) : null}
      </section>

      {pendingAttempt && attempt ? (
        <section
          aria-labelledby="simulation-title"
          className="rounded-card border border-line-soft p-6"
        >
          <h2 id="simulation-title" className="text-lg font-bold">
            Paiement simulé en attente
          </h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Moyen</dt>
              <dd>{PAYMENT_METHOD_LABELS[attempt.method]}</dd>
            </div>
            {attempt.msisdn_masked ? (
              <div className="flex justify-between gap-4">
                <dt>Numéro</dt>
                <dd>{attempt.msisdn_masked}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt>Référence fictive</dt>
              <dd className="font-mono">{attempt.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Temps restant</dt>
              <dd
                aria-label={
                  remaining === null
                    ? "Calcul du temps restant"
                    : `${Math.floor(remaining / 60)} minutes et ${remaining % 60} secondes`
                }
              >
                {remaining === null
                  ? "…"
                  : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-muted">
            Aucun débit n’est effectué. Choisissez un résultat pour tester le parcours.
          </p>
          {attempt.method === "tmoney" || attempt.method === "flooz" ? (
            <div
              role="group"
              aria-label={`${PAYMENT_METHOD_LABELS[attempt.method]} simulé`}
              className="mt-4 rounded-option bg-surface p-4 text-sm"
            >
              <p className="font-semibold">Écran mobile money fictif</p>
              <p className="mt-1 text-muted">
                Une confirmation serait demandée sur votre téléphone. Aucun code secret n’est
                demandé dans ce parcours.
              </p>
            </div>
          ) : attempt.method === "card" ? (
            <p className="mt-4 rounded-option bg-surface p-4 text-sm">
              Carte de démonstration : aucun numéro, cryptogramme ou code n’est demandé.
            </p>
          ) : null}
          <form action={resolveAction} className="mt-5 flex flex-wrap gap-3">
            <input type="hidden" name="number" value={number} />
            <input type="hidden" name="reference" value={attempt.reference} />
            <Button name="outcome" value="succeeded" type="submit" disabled={resolvePending}>
              Simuler la validation
            </Button>
            <Button
              name="outcome"
              value="failed"
              type="submit"
              variant="secondary"
              disabled={resolvePending}
            >
              Simuler un refus
            </Button>
          </form>
          {resolveState.error ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {orderErrorMessage(resolveState.error)}
            </p>
          ) : null}
        </section>
      ) : (
        <section
          aria-labelledby="start-payment-title"
          className="rounded-card border border-line-soft p-6"
        >
          <h2 id="start-payment-title" className="text-lg font-bold">
            {attempt?.outcome === "failed" ? "Réessayer la simulation" : "Lancer une simulation"}
          </h2>
          {attempt?.outcome === "failed" ? (
            <p className="mt-2 text-sm text-muted">La tentative précédente a été refusée.</p>
          ) : null}
          {remaining === 0 && attempt?.outcome === "pending" ? (
            <p className="mt-2 text-sm text-muted">
              Cette tentative a expiré. Vous pouvez en lancer une nouvelle.
            </p>
          ) : null}
          <form action={startAction} className="mt-5 grid gap-5">
            <input type="hidden" name="number" value={number} />
            <Field id="method" label="Moyen de paiement">
              <select
                id="method"
                name="method"
                defaultValue={paymentMethod}
                className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
              >
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="msisdn"
              label="Téléphone mobile money (facultatif pour carte ou paiement à la livraison)"
            >
              <input
                id="msisdn"
                name="msisdn"
                type="tel"
                inputMode="tel"
                placeholder="+228 90 12 34 56"
                maxLength={24}
                className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
              />
            </Field>
            <p className="text-sm text-muted">
              La carte bancaire ne demande aucune donnée de carte. Il s’agit uniquement d’une
              simulation.
            </p>
            <Button type="submit" disabled={startPending}>
              {startPending ? "Préparation…" : "Démarrer la simulation"}
            </Button>
          </form>
          {startState.error ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {orderErrorMessage(startState.error)}
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
}
