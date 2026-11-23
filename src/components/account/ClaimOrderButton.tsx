"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { initialClaimOrderActionState } from "@/lib/auth/claim-action-state";
import { claimGuestOrder } from "@/server/actions/account";

export function ClaimOrderButton({ number }: { number: string }) {
  const [state, formAction, pending] = useActionState(
    claimGuestOrder,
    initialClaimOrderActionState,
  );
  return (
    <div className="mt-5">
      <form action={formAction}>
        <input type="hidden" name="number" value={number} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Rattachement…" : "Rattacher cette commande à mon compte"}
        </Button>
      </form>
      {state.error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="mt-3 text-sm">
          {state.success}
        </p>
      ) : null}
    </div>
  );
}
