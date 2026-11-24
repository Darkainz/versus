"use client";

import { useActionState } from "react";
import { saveDeliverySettings } from "@/server/actions/admin";
import { initialSettingsActionState } from "@/lib/auth/admin-action-state";

type Zone = {
  code: string;
  label: string;
  fee_fcfa: number;
  free_from_fcfa: number | null;
  eta_label: string;
};

type Settings = {
  banner_text: string;
  cod_max_fcfa: number;
  payment_ttl_minutes: number;
  attempt_ttl_seconds: number;
  max_qty_per_line: number;
  max_orders_per_phone_hour: number;
  max_open_cod_per_phone: number;
  max_orders_per_hour: number;
};

export function DeliverySettingsForm({
  zones,
  settings,
}: {
  zones: readonly Zone[];
  settings: Settings;
}) {
  const [state, formAction, pending] = useActionState(
    saveDeliverySettings,
    initialSettingsActionState,
  );
  return (
    <form action={formAction} className="mt-6 grid gap-6">
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Zones</h2>
        {zones.map((zone) => (
          <fieldset
            key={zone.code}
            className="grid gap-3 rounded-card border border-line-soft p-4 md:grid-cols-3"
          >
            <input type="hidden" name="code" value={zone.code} />
            <p className="font-semibold">{zone.label}</p>
            <label className="grid gap-1 text-sm">
              Frais (FCFA)
              <input
                name={`fee_${zone.code}`}
                type="number"
                min={0}
                defaultValue={zone.fee_fcfa}
                className="min-h-11 rounded-option border border-line px-3"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Livraison offerte dès
              <input
                name={`free_${zone.code}`}
                type="number"
                min={1}
                defaultValue={zone.free_from_fcfa ?? ""}
                className="min-h-11 rounded-option border border-line px-3"
              />
            </label>
            <label className="grid gap-1 text-sm md:col-span-3">
              Délai indicatif
              <input
                name={`eta_${zone.code}`}
                defaultValue={zone.eta_label}
                required
                className="min-h-11 w-full rounded-option border border-line px-3"
              />
            </label>
          </fieldset>
        ))}
      </section>
      <section className="grid gap-4 rounded-card border border-line-soft p-5">
        <input type="hidden" name="shop" value="on" />
        <h2 className="text-lg font-semibold">Paramètres généraux</h2>
        <label className="grid gap-1 text-sm">
          Texte de la bannière
          <input
            name="banner_text"
            defaultValue={settings.banner_text}
            required
            maxLength={300}
            className="min-h-11 rounded-option border border-line px-3"
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Plafond COD
            <input
              name="cod_max_fcfa"
              type="number"
              min={1}
              defaultValue={settings.cod_max_fcfa}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Paiement (minutes)
            <input
              name="payment_ttl_minutes"
              type="number"
              min={1}
              max={1440}
              defaultValue={settings.payment_ttl_minutes}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Tentative (secondes)
            <input
              name="attempt_ttl_seconds"
              type="number"
              min={1}
              defaultValue={settings.attempt_ttl_seconds}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Quantité maximale par ligne
            <input
              name="max_qty_per_line"
              type="number"
              min={1}
              max={5}
              defaultValue={settings.max_qty_per_line}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Commandes/telephone/heure
            <input
              name="max_orders_per_phone_hour"
              type="number"
              min={1}
              defaultValue={settings.max_orders_per_phone_hour}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            COD ouverts/téléphone
            <input
              name="max_open_cod_per_phone"
              type="number"
              min={1}
              defaultValue={settings.max_open_cod_per_phone}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
          <label className="grid gap-1 text-sm">
            Commandes globales/heure
            <input
              name="max_orders_per_hour"
              type="number"
              min={1}
              defaultValue={settings.max_orders_per_hour}
              className="min-h-11 rounded-option border border-line px-3"
            />
          </label>
        </div>
      </section>
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
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 max-w-xs rounded-option border border-line px-4 font-semibold"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
