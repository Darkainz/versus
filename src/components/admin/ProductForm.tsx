"use client";

import { useActionState } from "react";
import { saveProduct } from "@/server/actions/admin";
import { initialProductAdminActionState } from "@/lib/auth/product-admin-action-state";

type ProductValue = {
  id: string;
  code: string;
  slug: string;
  brand_slug: string;
  category_slug: string;
  name: string;
  tagline: string;
  description: string;
  visual_kind: string;
  release_date: string;
  new_until: string | null;
  warranty_months: number;
  compat: readonly string[];
  is_active: boolean;
};

const inputClassName = "min-h-12 rounded-option border border-line bg-bg px-3";

export function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: ProductValue;
  brands: readonly { slug: string; name: string }[];
  categories: readonly { slug: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initialProductAdminActionState);
  return (
    <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <label className="grid gap-1 text-sm">
        Code
        <input
          name="code"
          defaultValue={product?.code ?? ""}
          required
          pattern="[a-z0-9]{2,12}"
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Slug
        <input
          name="slug"
          defaultValue={product?.slug ?? ""}
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Marque
        <select
          name="brand_slug"
          defaultValue={product?.brand_slug ?? ""}
          required
          className={inputClassName}
        >
          <option value="">Choisir</option>
          {brands.map((brand) => (
            <option key={brand.slug} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Catégorie
        <select
          name="category_slug"
          defaultValue={product?.category_slug ?? ""}
          required
          className={inputClassName}
        >
          <option value="">Choisir</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        Nom
        <input
          name="name"
          defaultValue={product?.name ?? ""}
          required
          maxLength={120}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        Accroche
        <input
          name="tagline"
          defaultValue={product?.tagline ?? ""}
          required
          maxLength={300}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        Description
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          maxLength={3000}
          rows={5}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Visuel
        <select
          name="visual_kind"
          defaultValue={product?.visual_kind ?? "phone"}
          required
          className={inputClassName}
        >
          <option value="phone">Téléphone</option>
          <option value="watch">Montre</option>
          <option value="round">Rond</option>
          <option value="band">Bracelet</option>
          <option value="buds">Écouteurs</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Garantie (mois)
        <input
          name="warranty_months"
          type="number"
          min={0}
          max={36}
          defaultValue={product?.warranty_months ?? 12}
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Date de sortie
        <input
          name="release_date"
          type="date"
          defaultValue={product?.release_date ?? ""}
          required
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        « Nouveau » jusqu’au
        <input
          name="new_until"
          type="date"
          defaultValue={product?.new_until ?? ""}
          className={inputClassName}
        />
      </label>
      <fieldset className="flex gap-5 text-sm md:col-span-2">
        <legend>Compatibilité</legend>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="compat"
            value="ios"
            defaultChecked={product?.compat.includes("ios")}
          />
          iOS
        </label>
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            name="compat"
            value="android"
            defaultChecked={product?.compat.includes("android")}
          />
          Android
        </label>
      </fieldset>
      <label className="flex min-h-11 items-center gap-3 text-sm md:col-span-2">
        <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? false} />
        Produit actif
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
        {pending ? "Enregistrement…" : product ? "Enregistrer" : "Créer le produit"}
      </button>
    </form>
  );
}
