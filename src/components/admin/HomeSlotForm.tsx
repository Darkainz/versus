"use client";

import { useActionState } from "react";
import { saveHomeSlot } from "@/server/actions/admin";
import { initialSettingsActionState } from "@/lib/auth/admin-action-state";

export function HomeSlotForm({
  slot,
  products,
}: {
  slot: {
    id: string;
    slot: "hero" | "tile" | "rail" | "compare";
    position: number;
    product_id: string;
    theme_key: string;
    headline: string | null;
    subline: string | null;
    is_active: boolean;
  };
  products: readonly { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveHomeSlot, initialSettingsActionState);
  return (
    <form
      action={formAction}
      className="grid gap-3 rounded-card border border-line-soft p-5 md:grid-cols-2"
    >
      <input type="hidden" name="id" value={slot.id} />
      <label className="grid gap-1 text-sm">
        Produit
        <select
          name="product_id"
          defaultValue={slot.product_id}
          required
          className="min-h-11 rounded-option border border-line px-3"
        >
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Type
        <select
          name="slot"
          defaultValue={slot.slot}
          required
          className="min-h-11 rounded-option border border-line px-3"
        >
          <option value="hero">Hero</option>
          <option value="tile">Tuile</option>
          <option value="rail">Rail</option>
          <option value="compare">Comparaison</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Position
        <input
          name="position"
          type="number"
          min={0}
          defaultValue={slot.position}
          required
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Thème
        <input
          name="theme_key"
          defaultValue={slot.theme_key}
          required
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Titre
        <input
          name="headline"
          defaultValue={slot.headline ?? ""}
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Sous-titre
        <input
          name="subline"
          defaultValue={slot.subline ?? ""}
          className="min-h-11 rounded-option border border-line px-3"
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={slot.is_active} />
        Emplacement actif
      </label>
      {state.error ? (
        <p role="alert" className="text-sm text-danger md:col-span-2">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="text-sm md:col-span-2">
          {state.success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-option border border-line px-4 font-semibold md:col-span-2"
      >
        {pending ? "Enregistrement…" : "Enregistrer l’emplacement"}
      </button>
    </form>
  );
}
