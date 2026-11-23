"use client";

import { useActionState } from "react";
import { initialAddressActionState } from "@/lib/auth/address-action-state";
import { deleteAddress } from "@/server/actions/account";

export function AddressDeleteButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteAddress, initialAddressActionState);
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 font-semibold text-danger underline"
        >
          {pending ? "Suppression…" : "Supprimer"}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-2 text-sm">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
