"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { initialCancelOrderActionState } from "@/lib/auth/cancel-action-state";
import { cancelMyOrder } from "@/server/actions/account";

export function CancelOrderButton({ number }: { number: string }) {
  const [state, formAction, pending] = useActionState(cancelMyOrder, initialCancelOrderActionState);
  return (
    <div className="mt-7">
      <form action={formAction}>
        <input type="hidden" name="number" value={number} />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Annulation…" : "Annuler cette commande"}
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
