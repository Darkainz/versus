"use client";

import { useActionState } from "react";
import { setOrderStatus } from "@/server/actions/admin";
import { initialOrderStatusActionState } from "@/lib/auth/admin-action-state";

export function OrderStatusActions({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
}: {
  orderId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  const [state, formAction, pending] = useActionState(
    setOrderStatus,
    initialOrderStatusActionState,
  );
  const allowed =
    status === "pending_payment"
      ? ["cancelled"]
      : status === "confirmed"
        ? ["preparing", "cancelled"]
        : status === "preparing"
          ? ["shipped", "cancelled"]
          : status === "shipped"
            ? ["delivered"]
            : [];
  const needsCash =
    status === "shipped" && paymentMethod === "cash_on_delivery" && paymentStatus === "cash_due";

  return (
    <form action={formAction} className="mt-6 grid max-w-xl gap-3">
      <input type="hidden" name="order_id" value={orderId} />
      <label className="grid gap-1 text-sm">
        Nouveau statut
        <select
          name="to"
          required
          disabled={allowed.length === 0}
          className="min-h-11 rounded-option border border-line px-3"
        >
          <option value="">Choisir</option>
          {allowed.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      {needsCash ? (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="cash_collected" />
          Montant encaissé à la livraison
        </label>
      ) : null}
      <label className="grid gap-1 text-sm">
        Note
        <input
          name="note"
          maxLength={500}
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <button
        type="submit"
        disabled={pending || allowed.length === 0}
        className="min-h-11 rounded-option border border-line px-4 font-semibold"
      >
        {pending ? "Mise à jour…" : "Appliquer"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
