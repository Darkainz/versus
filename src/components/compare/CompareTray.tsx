"use client";

import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { routeFor } from "@/config/site";
import { updateCompare } from "@/lib/compare/compare-store";
import { useCompare } from "@/lib/compare/use-compare";

export function CompareTray() {
  const state = useCompare();
  const titleId = useId();
  if (state.products.length === 0 && !state.notice && !state.pendingProduct) return null;

  const compareHref = routeFor("comparer");
  const query = state.products.map(({ code }) => code).join(",");

  return (
    <>
      {state.products.length > 0 ? (
        <aside
          aria-label="Sélection du comparateur"
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-bg/95 p-3 shadow-tray backdrop-blur sm:p-4"
        >
          <div className="wrap flex flex-wrap items-center gap-3">
            <p className="font-semibold" aria-live="polite">
              Comparateur <span className="text-muted">({state.products.length}/3)</span>
            </p>
            <ul className="flex min-w-0 flex-1 flex-wrap gap-2" role="list">
              {state.products.map((product) => (
                <li key={product.code}>
                  <button
                    type="button"
                    className="min-h-11 rounded-full border border-line-control px-4 text-sm state-hover:bg-surface"
                    aria-label={`Retirer ${product.name} du comparateur`}
                    onClick={() => updateCompare({ type: "remove", code: product.code })}
                  >
                    {product.name} ×
                  </button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="md"
              variant="secondary"
              onClick={() => updateCompare({ type: "clear" })}
            >
              Vider
            </Button>
            {compareHref ? (
              <Button href={`${compareHref}?p=${query}`} size="md">
                Comparer
              </Button>
            ) : null}
          </div>
        </aside>
      ) : null}
      {state.notice ? (
        <div
          role="status"
          className="fixed right-4 bottom-24 z-40 flex max-w-[min(100%-32px,420px)] items-center gap-3 rounded-control bg-ink px-4 py-3 text-sm text-on-dark shadow-tray"
        >
          <span>{state.notice}</span>
          <button
            type="button"
            className="min-h-11 px-2 font-semibold underline underline-offset-4"
            onClick={() => updateCompare({ type: "dismissNotice" })}
          >
            Fermer
          </button>
        </div>
      ) : null}
      <Dialog
        open={state.pendingProduct !== null}
        onClose={() => updateCompare({ type: "cancelReplacement" })}
        labelledBy={titleId}
      >
        <h2 id={titleId} className="font-display text-xl font-bold">
          Remplacer la sélection ?
        </h2>
        <p className="mt-3 text-muted">
          Le comparateur ne peut contenir que des produits de la même famille. Remplacer la
          sélection par {state.pendingProduct?.name} ?
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => updateCompare({ type: "confirmReplacement" })} data-autofocus>
            Remplacer
          </Button>
          <Button variant="secondary" onClick={() => updateCompare({ type: "cancelReplacement" })}>
            Annuler
          </Button>
        </div>
      </Dialog>
    </>
  );
}
