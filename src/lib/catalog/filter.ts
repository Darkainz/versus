import { z } from "zod";
import { BRANDS } from "@/lib/brand-themes";
import { CATEGORIES, type CategorySlug } from "./types";

const filterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  brand: z.union([z.enum(BRANDS), z.array(z.enum(BRANDS))]).optional(),
  minPrice: z.string().regex(/^\d+$/).optional(),
  maxPrice: z.string().regex(/^\d+$/).optional(),
  inStock: z.literal("1").optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
});

export type CatalogFilters = {
  category?: CategorySlug;
  brands: readonly (typeof BRANDS)[number][];
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  sort: "newest" | "price-asc" | "price-desc";
};

export type SearchParams = Record<string, string | string[] | undefined>;

export function parseCatalogFilters(params: SearchParams) {
  const parsed = filterSchema.safeParse({
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    inStock: params.inStock,
    sort: params.sort,
  });

  if (!parsed.success) {
    return {
      filters: { brands: [], inStock: false, sort: "newest" } satisfies CatalogFilters,
      error: "Certains filtres sont invalides. Vérifiez vos critères puis réessayez.",
    };
  }

  const { brand, category, minPrice, maxPrice, inStock, sort } = parsed.data;
  const minimum = minPrice === undefined ? undefined : Number(minPrice);
  const maximum = maxPrice === undefined ? undefined : Number(maxPrice);
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    return {
      filters: { brands: [], inStock: false, sort: "newest" } satisfies CatalogFilters,
      error: "Le prix minimum doit être inférieur ou égal au prix maximum.",
    };
  }

  return {
    filters: {
      ...(category ? { category } : {}),
      brands: brand === undefined ? [] : Array.isArray(brand) ? brand : [brand],
      inStock: inStock === "1",
      sort,
      ...(minimum === undefined ? {} : { minPrice: minimum }),
      ...(maximum === undefined ? {} : { maxPrice: maximum }),
    } satisfies CatalogFilters,
    error: null,
  };
}

export type FilterableProduct = {
  category_slug: string;
  brand_slug: string;
  min_price_fcfa: number | null;
  in_stock: boolean;
  release_date: string;
};

export function filterCatalog<T extends FilterableProduct>(
  products: readonly T[],
  filters: CatalogFilters,
): T[] {
  const filtered = products.filter(
    (product) =>
      (!filters.category || product.category_slug === filters.category) &&
      (filters.brands.length === 0 || filters.brands.includes(product.brand_slug as (typeof BRANDS)[number])) &&
      (filters.minPrice === undefined ||
        (product.min_price_fcfa !== null && product.min_price_fcfa >= filters.minPrice)) &&
      (filters.maxPrice === undefined ||
        (product.min_price_fcfa !== null && product.min_price_fcfa <= filters.maxPrice)) &&
      (!filters.inStock || product.in_stock),
  );

  return filtered.toSorted((first, second) => {
    if (filters.sort === "price-asc") {
      return (first.min_price_fcfa ?? 0) - (second.min_price_fcfa ?? 0);
    }
    if (filters.sort === "price-desc") {
      return (second.min_price_fcfa ?? 0) - (first.min_price_fcfa ?? 0);
    }
    return second.release_date.localeCompare(first.release_date);
  });
}
