"use client";

import { useActionState } from "react";
import { saveVariant } from "@/server/actions/admin";
import { initialProductAdminActionState } from "@/lib/auth/product-admin-action-state";

const inputClassName = "min-h-11 rounded-option border border-line px-3";

type Variant = {
  id: string;
  sku: string;
  color_name: string;
  color_slug: string;
  color_hex: string | null;
  storage_gb: number | null;
  size_mm: number | null;
  price_fcfa: number;
  low_stock_threshold: number;
  is_default: boolean;
  is_active: boolean;
};

export function VariantForm({
  productId,
  categorySlug,
  variant,
}: {
  productId: string;
  categorySlug: string;
  variant?: Variant;
}) {
  const [state, formAction, pending] = useActionState(saveVariant, initialProductAdminActionState);
  return (
    <form
      action={formAction}
      aria-label={variant ? `Modifier variante ${variant.sku}` : "Nouvelle variante"}
      className="mt-5 grid gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="product_id" value={productId} />
      {variant ? <input type="hidden" name="variant_id" value={variant.id} /> : null}
      <label className="grid gap-1 text-sm">
        SKU
        <input
          name="sku"
          defaultValue={variant?.sku ?? ""}
          required
          pattern="[A-Z0-9-]{4,40}"
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Couleur
        <input
          name="color_name"
          defaultValue={variant?.color_name ?? ""}
          required
          maxLength={60}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Slug couleur
        <input
          name="color_slug"
          defaultValue={variant?.color_slug ?? ""}
          required
          pattern="[a-z0-9-]{1,30}"
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Hex couleur
        <input
          name="color_hex"
          defaultValue={variant?.color_hex ?? ""}
          pattern="#[0-9A-Fa-f]{6}"
          className={inputClassName}
        />
      </label>
      {categorySlug === "smartphones" ? (
        <label className="grid gap-1 text-sm">
          Stockage (Go)
          <input
            name="storage_gb"
            type="number"
            min={1}
            defaultValue={variant?.storage_gb ?? ""}
            className={inputClassName}
          />
        </label>
      ) : null}
      {categorySlug === "montres" || categorySlug === "bracelets" ? (
        <label className="grid gap-1 text-sm">
          Taille (mm)
          <input
            name="size_mm"
            type="number"
            min={20}
            max={60}
            defaultValue={variant?.size_mm ?? ""}
            className={inputClassName}
          />
        </label>
      ) : null}
      <label className="grid gap-1 text-sm">
        Prix indicatif (FCFA)
        <input
          name="price_fcfa"
          type="number"
          min={1000}
          max={5000000}
          defaultValue={variant?.price_fcfa ?? ""}
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Seuil stock bas
        <input
          name="low_stock_threshold"
          type="number"
          min={0}
          max={32767}
          defaultValue={variant?.low_stock_threshold ?? 3}
          required
          className={inputClassName}
        />
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" defaultChecked={variant?.is_default ?? false} />
        Variante par défaut
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={variant?.is_active ?? true} />
        Variante active
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
        {pending ? "Enregistrement…" : variant ? "Enregistrer la variante" : "Ajouter la variante"}
      </button>
    </form>
  );
}
