"use client";

import { Button } from "@/components/ui/Button";
import type { CatalogProductRow } from "@/lib/catalog/types";
import { updateCompare } from "@/lib/compare/compare-store";
import { useCompare } from "@/lib/compare/use-compare";

export function CompareButton({
  product,
  className,
  iconOnly = false,
}: {
  product: Pick<CatalogProductRow, "code" | "name" | "compare_group">;
  className?: string;
  iconOnly?: boolean;
}) {
  const { products } = useCompare();
  const selected = products.some((item) => item.code === product.code);

  return (
    <Button
      variant="secondary"
      size="md"
      className={className}
      pressed={selected}
      aria-label={
        selected
          ? `${iconOnly ? "VS" : "Ajouté"} : retirer ${product.name} du comparateur`
          : `${iconOnly ? "VS" : "+ Comparer"} : ajouter ${product.name} au comparateur`
      }
      onClick={() =>
        updateCompare(
          selected
            ? { type: "remove", code: product.code }
            : {
                type: "add",
                product: {
                  code: product.code,
                  name: product.name,
                  compare_group: product.compare_group,
                },
              },
        )
      }
    >
      {iconOnly ? "VS" : selected ? "Ajouté" : "+ Comparer"}
    </Button>
  );
}
