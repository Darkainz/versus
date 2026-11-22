import type { ProductVariant } from "./types";
import type { SearchParams } from "./filter";

type VariantParams = Partial<Pick<SearchParams, "couleur" | "stockage" | "taille">>;

function oneValue(value: string | string[] | undefined): string | undefined | null {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? null : value;
}

function dimension(value: string | undefined): number | undefined | null {
  if (value === undefined) return undefined;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function selectVariant(
  variants: readonly ProductVariant[],
  params: VariantParams,
): { variant: ProductVariant; invalidSelection: boolean } {
  const color = oneValue(params.couleur);
  const storageValue = oneValue(params.stockage);
  const sizeValue = oneValue(params.taille);
  const storage = dimension(storageValue ?? undefined);
  const size = dimension(sizeValue ?? undefined);
  const invalidParam =
    color === null ||
    storageValue === null ||
    sizeValue === null ||
    storage === null ||
    size === null;

  const candidates = variants.filter(
    (variant) =>
      variant.is_active &&
      (color === undefined || variant.color_slug === color) &&
      (storage === undefined || variant.storage_gb === storage) &&
      (size === undefined || variant.size_mm === size),
  );
  const variant = candidates.find((candidate) => candidate.is_default) ?? candidates[0];
  const fallback =
    variants.find((candidate) => candidate.is_default && candidate.is_active) ??
    variants.find((candidate) => candidate.is_active);

  const selected = variant ?? fallback;
  if (!selected) {
    throw new Error("Aucune variante active n'est disponible pour ce produit.");
  }

  return {
    variant: selected,
    invalidSelection:
      invalidParam ||
      ((color !== undefined || storageValue !== undefined || sizeValue !== undefined) && !variant),
  };
}
