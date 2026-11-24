import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { filterCatalog, parseCatalogFilters } from "./filter";

describe("parseCatalogFilters", () => {
  it("normalise les marques répétées et les prix", () => {
    const result = parseCatalogFilters({
      brand: ["apple", "xiaomi"],
      minPrice: "30000",
      maxPrice: "300000",
      inStock: "1",
      sort: "price-asc",
    });

    expect(result.error).toBeNull();
    expect(result.filters).toEqual({
      brands: ["apple", "xiaomi"],
      minPrice: 30000,
      maxPrice: 300000,
      inStock: true,
      sort: "price-asc",
    });
  });

  it("signale les filtres inconnus et un intervalle incohérent", () => {
    expect(parseCatalogFilters({ sort: "random" }).error).toMatch(/invalides/i);
    expect(parseCatalogFilters({ minPrice: "900", maxPrice: "100" }).error).toMatch(
      /minimum doit être inférieur/i,
    );
  });
});

describe("filterCatalog", () => {
  it("combine les critères et trie sans modifier le catalogue source", () => {
    const initialCount = products.length;
    const result = filterCatalog(products, {
      brands: ["xiaomi"],
      category: "montres",
      minPrice: 72000,
      maxPrice: 72000,
      inStock: true,
      sort: "price-asc",
    });

    expect(result.map(({ code }) => code)).toEqual(["rw6"]);
    expect(products).toHaveLength(initialCount);
  });
});
