export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}

export type SearchableProduct = {
  name: string;
  tagline: string;
  description?: string;
  brand_name: string;
  brand_slug: string;
  category_slug: string;
  variants?: readonly { color_name: string }[];
};

export function searchCatalog<T extends SearchableProduct>(
  products: readonly T[],
  query: string,
): T[] {
  const needle = normalizeSearchText(query);
  if (!needle) return [];

  return products.filter((product) =>
    [
      product.name,
      product.tagline,
      product.description ?? "",
      product.brand_name,
      ...(product.brand_slug === "xiaomi" ? ["Redmi"] : []),
      product.category_slug,
      ...(product.variants?.map((variant) => variant.color_name) ?? []),
    ].some((value) => normalizeSearchText(value).includes(needle)),
  );
}
