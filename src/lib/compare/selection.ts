import type { CatalogProductRow } from "@/lib/catalog/types";

/**
 * Résout les codes de `?p=` parmi les produits actifs.
 * Un code seul est complété par les choix d'accueil de sa famille, puis par les produits les plus
 * récents. Sans code, la sélection complète des emplacements `compare` de l'accueil est renvoyée.
 */
export function resolveCompareSelection(
  requestedCodes: readonly string[] | undefined,
  activeProducts: readonly CatalogProductRow[],
  homeCompareProducts: readonly CatalogProductRow[],
): CatalogProductRow[] {
  if (!requestedCodes?.length) return [...homeCompareProducts];

  const productsByCode = new Map(activeProducts.map((product) => [product.code, product]));
  const requested: CatalogProductRow[] = [];
  const seen = new Set<string>();
  for (const code of requestedCodes) {
    if (seen.has(code)) continue;
    const product = productsByCode.get(code);
    if (product) {
      requested.push(product);
      seen.add(code);
    }
  }
  const first = requested[0];
  if (!first) return [];

  const sameFamily = requested
    .filter((product) => product.compare_group === first.compare_group)
    .slice(0, 3);
  if (sameFamily.length !== 1) return sameFamily;

  const candidates = [
    ...homeCompareProducts.filter((product) => product.compare_group === first.compare_group),
    ...activeProducts
      .filter((product) => product.compare_group === first.compare_group)
      .toSorted(
        (a, b) => b.release_date.localeCompare(a.release_date) || a.code.localeCompare(b.code),
      ),
  ];
  const selected = [...sameFamily];
  for (const candidate of candidates) {
    if (selected.length === 3) break;
    if (!selected.some((product) => product.code === candidate.code)) selected.push(candidate);
  }
  return selected;
}
