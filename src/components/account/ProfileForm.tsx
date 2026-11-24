"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { initialProfileActionState } from "@/lib/auth/profile-action-state";
import { updateProfile } from "@/server/actions/account";

const inputClassName = "min-h-12 rounded-option border border-line bg-bg px-3 font-normal";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialProfileActionState);
  return (
    <form action={formAction} className="mt-6 grid gap-5">
      <Field id="full_name" label="Nom complet" required>
        <input
          id="full_name"
          name="full_name"
          autoComplete="name"
          defaultValue={fullName}
          minLength={2}
          maxLength={120}
          required
          className={inputClassName}
        />
      </Field>
      <Field id="phone" label="Téléphone (facultatif)" hint="Numéro togolais, indicatif +228.">
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          defaultValue={phone ?? ""}
          maxLength={24}
          className={inputClassName}
        />
      </Field>
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
        {pending ? "Enregistrement…" : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
