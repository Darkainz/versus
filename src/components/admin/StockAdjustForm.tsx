"use client";

import { useActionState } from "react";
import { adjustStock } from "@/server/actions/admin";
import { initialStockActionState } from "@/lib/auth/admin-action-state";

export function StockAdjustForm({
  variantId,
  sku,
  stock,
}: {
  variantId: string;
  sku: string;
  stock: number;
}) {
  const [state, formAction, pending] = useActionState(adjustStock, initialStockActionState);
  return (
    <form
      action={formAction}
      className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px_160px_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="variant_id" value={variantId} />
      <p className="text-sm">
        <strong>{sku}</strong>
        <span className="block text-muted">Stock actuel : {stock}</span>
      </p>
      <label className="grid gap-1 text-sm">
        Variation
        <input
          name="delta"
          type="number"
          required
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Motif
        <select name="reason" required className="min-h-11 rounded-option border border-line px-3">
          <option value="restock">Réapprovisionnement</option>
          <option value="correction">Correction</option>
          <option value="damage">Endommagé</option>
        </select>
      </label>
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
        disabled={pending}
        className="min-h-11 rounded-option border border-line px-4 font-semibold"
      >
        {pending ? "Ajustement…" : "Ajuster"}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-danger sm:col-span-5">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm sm:col-span-5">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
