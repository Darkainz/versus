"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { initialAddressActionState } from "@/lib/auth/address-action-state";
import { saveAddress } from "@/server/actions/account";

type AddressValues = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  zone_code: string;
  city: string;
  district: string;
  landmark: string;
  instructions: string | null;
  is_default: boolean;
};

const inputClassName = "min-h-12 rounded-option border border-line bg-bg px-3 font-normal";

export function AddressForm({
  address,
  zones,
}: {
  address?: AddressValues;
  zones: readonly { code: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveAddress, initialAddressActionState);
  const prefix = address?.id ?? "nouvelle";
  return (
    <form action={formAction} className="grid gap-4">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <Field id={`${prefix}-label`} label="Nom de l’adresse" required>
        <input
          id={`${prefix}-label`}
          name="label"
          defaultValue={address?.label ?? "Domicile"}
          minLength={1}
          maxLength={60}
          required
          className={inputClassName}
        />
      </Field>
      <Field id={`${prefix}-recipient`} label="Nom du destinataire" required>
        <input
          id={`${prefix}-recipient`}
          name="recipient_name"
          autoComplete="name"
          defaultValue={address?.recipient_name ?? ""}
          minLength={2}
          maxLength={120}
          required
          className={inputClassName}
        />
      </Field>
      <Field
        id={`${prefix}-phone`}
        label="Téléphone"
        hint="Numéro togolais, indicatif +228."
        required
      >
        <input
          id={`${prefix}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          defaultValue={address?.phone ?? ""}
          required
          className={inputClassName}
        />
      </Field>
      <Field id={`${prefix}-zone`} label="Zone de livraison" required>
        <select
          id={`${prefix}-zone`}
          name="zone_code"
          defaultValue={address?.zone_code ?? ""}
          required
          className={inputClassName}
        >
          <option value="">Choisir une zone</option>
          {zones.map((zone) => (
            <option key={zone.code} value={zone.code}>
              {zone.label}
            </option>
          ))}
        </select>
      </Field>
      <Field id={`${prefix}-city`} label="Ville" required>
        <input
          id={`${prefix}-city`}
          name="city"
          autoComplete="address-level2"
          defaultValue={address?.city ?? ""}
          maxLength={100}
          required
          className={inputClassName}
        />
      </Field>
      <Field id={`${prefix}-district`} label="Quartier" required>
        <input
          id={`${prefix}-district`}
          name="district"
          defaultValue={address?.district ?? ""}
          maxLength={100}
          required
          className={inputClassName}
        />
      </Field>
      <Field id={`${prefix}-landmark`} label="Repère / indication" required>
        <input
          id={`${prefix}-landmark`}
          name="landmark"
          defaultValue={address?.landmark ?? ""}
          maxLength={200}
          required
          className={inputClassName}
        />
      </Field>
      <Field id={`${prefix}-instructions`} label="Instructions complémentaires">
        <textarea
          id={`${prefix}-instructions`}
          name="instructions"
          defaultValue={address?.instructions ?? ""}
          maxLength={500}
          rows={3}
          className={inputClassName}
        />
      </Field>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={address?.is_default ?? false}
          className="size-4 accent-current"
        />
        Utiliser comme adresse par défaut
      </label>
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
      <Button type="submit" disabled={pending}>
        {pending
          ? "Enregistrement…"
          : address
            ? "Enregistrer les modifications"
            : "Ajouter l’adresse"}
      </Button>
    </form>
  );
}
