"use client";

import { useActionState } from "react";
import { compareRows } from "@/lib/compare/rows";
import type { Tables } from "@/lib/database.types";
import { initialProductAdminActionState } from "@/lib/auth/product-admin-action-state";
import { saveProductSpecs } from "@/server/actions/admin";

const inputClassName = "min-h-11 rounded-option border border-line px-3";
const compareRowLabels = new Map(
  Object.values(compareRows)
    .flat()
    .map((row) => [row.key, row.label] as const),
);

function compareLabel(key: string) {
  const label = compareRowLabels.get(key);
  if (!label) throw new Error(`Ligne de comparaison introuvable : ${key}`);
  return label;
}

function optionalSelectValue(value: boolean | null | undefined) {
  return value == null ? "" : value ? "true" : "false";
}

export function ProductSpecsForm({
  productId,
  specs,
}: {
  productId: string;
  specs: Tables<"product_specs"> | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveProductSpecs,
    initialProductAdminActionState,
  );

  return (
    <form
      action={formAction}
      aria-label="Spécifications du produit"
      className="mt-5 grid gap-3 md:grid-cols-2"
    >
      <input type="hidden" name="product_id" value={productId} />
      <label className="grid gap-1 text-sm">
        {compareLabel("screen")} (diagonale, pouces)
        <input
          name="screen_size_in"
          type="number"
          min={0.01}
          max={9.99}
          step={0.01}
          defaultValue={specs?.screen_size_in ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("screen")} (technologie)
        <input
          name="screen_tech"
          maxLength={60}
          defaultValue={specs?.screen_tech ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("refresh")} (Hz)
        <input
          name="refresh_hz"
          type="number"
          min={1}
          max={32767}
          defaultValue={specs?.refresh_hz ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("chip")}
        <input
          name="chip"
          maxLength={120}
          defaultValue={specs?.chip ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Batterie (mAh)
        <input
          name="battery_mah"
          type="number"
          min={1}
          defaultValue={specs?.battery_mah ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("autonomy")} (heures)
        <input
          name="autonomy_hours"
          type="number"
          min={1}
          defaultValue={specs?.autonomy_hours ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("charging")} (W)
        <input
          name="charging_w"
          type="number"
          min={1}
          max={32767}
          defaultValue={specs?.charging_w ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("camera")} (Mpx)
        <input
          name="main_camera_mp"
          type="number"
          min={1}
          max={32767}
          defaultValue={specs?.main_camera_mp ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("weight")} (g)
        <input
          name="weight_g"
          type="number"
          min={0.1}
          max={9999.9}
          step={0.1}
          defaultValue={specs?.weight_g ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("ip")}
        <input
          name="ip_rating"
          maxLength={30}
          defaultValue={specs?.ip_rating ?? ""}
          className={inputClassName}
        />
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("5g")}
        <select
          name="has_5g"
          defaultValue={optionalSelectValue(specs?.has_5g)}
          className={inputClassName}
        >
          <option value="">Non renseigné</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {compareLabel("anc")}
        <select
          name="has_anc"
          defaultValue={optionalSelectValue(specs?.has_anc)}
          className={inputClassName}
        >
          <option value="">Non renseigné</option>
          <option value="true">Oui</option>
          <option value="false">Non</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm md:col-span-2">
        Note des spécifications
        <textarea
          name="specs_note"
          rows={3}
          maxLength={500}
          defaultValue={specs?.specs_note ?? "Valeurs indicatives, projet pédagogique"}
          className={inputClassName}
        />
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
        {pending ? "Enregistrement…" : "Enregistrer les spécifications"}
      </button>
    </form>
  );
}
