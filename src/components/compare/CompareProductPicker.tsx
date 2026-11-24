"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { CatalogProductRow, CompareGroup } from "@/lib/catalog/types";

const groupLabels: Record<CompareGroup, string> = {
  phones: "Smartphones",
  audio: "Écouteurs",
  wearables: "Montres et bracelets",
};

export function CompareProductPicker({
  products,
  selected,
  diffOnly,
}: {
  products: readonly CatalogProductRow[];
  selected: readonly CatalogProductRow[];
  diffOnly: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const initialCodes = selected.map(({ code }) => code);
  const initialKey = initialCodes.join(",");
  const [codes, setCodes] = useState(initialCodes);

  useEffect(() => {
    // Keep the native selections aligned with a new URL after a same-route navigation.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCodes(initialKey ? initialKey.split(",") : []);
  }, [initialKey]);

  const productsByCode = new Map(products.map((product) => [product.code, product]));
  const selectedGroup = productsByCode.get(codes[0] ?? "")?.compare_group;
  const options = products.filter(
    (product) => !selectedGroup || product.compare_group === selectedGroup,
  );

  function choose(index: number, code: string) {
    const next = [...codes];
    next[index] = code;
    const chosen = next.flatMap((item) => (item ? [item] : []));
    const group = productsByCode.get(chosen[0] ?? "")?.compare_group;
    const sameGroup = chosen
      .filter((item) => productsByCode.get(item)?.compare_group === group)
      .filter((item, position, all) => all.indexOf(item) === position)
      .slice(0, 3);
    setCodes(sameGroup);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codes.length === 0) return;
    const query = new URLSearchParams({ p: codes.join(",") });
    if (diffOnly) query.set("diff", "1");
    router.push(`${pathname}?${query.toString()}`);
  }

  return (
    <details className="rounded-card border border-line-soft bg-bg p-5">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold">
        Choisir les modèles à comparer
      </summary>
      <form onSubmit={submit} className="mt-4">
        <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          <legend className="sr-only">Modèles du comparateur</legend>
          {[0, 1, 2].map((index) => (
            <label key={index} className="grid min-w-0 grid-cols-1 gap-2 text-sm font-medium">
              Modèle {index + 1}
              <select
                value={codes[index] ?? ""}
                onChange={(event) => choose(index, event.currentTarget.value)}
                // w-full min-w-0 : sans cela, la largeur intrinsèque des options (352 px) élargit la grille et
                // fait déborder la page à 768 px et rogne les sélecteurs à 360 px.
                className="min-h-11 w-full max-w-full min-w-0 rounded-control border border-line-control bg-bg px-3 text-ink"
              >
                <option value="">Aucun</option>
                {options.map((product) => (
                  <option
                    key={product.code}
                    value={product.code}
                    disabled={codes.some(
                      (code, selectedIndex) => code === product.code && selectedIndex !== index,
                    )}
                  >
                    {groupLabels[product.compare_group]} · {product.brand_name} {product.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
        <Button type="submit" className="mt-4" disabled={codes.length === 0}>
          Mettre à jour la sélection
        </Button>
      </form>
    </details>
  );
}
