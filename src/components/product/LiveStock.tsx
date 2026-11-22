import { connection } from "next/server";
import { getVariantsStock } from "@/lib/catalog/queries";
import type { ProductVariant } from "@/lib/catalog/types";

/**
 * Composant de stock en temps réel (PLAN §3.3, §6 étape 4) :
 * `await connection()`, sans cache, sous <Suspense> pour le rendu partiel (PPR).
 */
export async function LiveStock({
  productId,
  selected,
}: {
  productId: string;
  selected: ProductVariant;
}) {
  await connection();
  const variants = await getVariantsStock(productId);
  const current = variants.find((variant) => variant.sku === selected.sku);

  if (!current) {
    return (
      <p role="status" className="mt-4 text-sm text-muted">
        Cette variante n&apos;est plus disponible. Choisissez une autre option.
      </p>
    );
  }

  return (
    <p aria-live="polite" className="mt-4 text-sm font-medium">
      {current.stock === 0
        ? "Indisponible actuellement"
        : current.stock <= current.low_stock_threshold
          ? `Plus que ${current.stock} en stock`
          : "En stock"}
    </p>
  );
}
