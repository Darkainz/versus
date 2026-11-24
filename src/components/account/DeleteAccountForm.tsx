"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { initialDeleteAccountActionState } from "@/lib/auth/delete-account-action-state";
import { deleteMyAccount } from "@/server/actions/account";

export function DeleteAccountForm() {
  const [state, formAction, pending] = useActionState(
    deleteMyAccount,
    initialDeleteAccountActionState,
  );
  return (
    <form action={formAction} className="mt-5 grid gap-4">
      <label htmlFor="delete-confirmation" className="text-sm font-semibold">
        Saisissez SUPPRIMER pour confirmer
      </label>
      <input
        id="delete-confirmation"
        name="confirmation"
        autoComplete="off"
        required
        className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
      />
      {state.error ? (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Suppression…" : "Supprimer mon compte"}
      </Button>
    </form>
  );
}
