import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { searchCatalog } from "./search";

describe("searchCatalog", () => {
  it("ignore les accents et trouve les produits par catégorie ou marque", () => {
    const earbuds = searchCatalog(products, "ecouteur");
    expect(earbuds).toHaveLength(
      products.filter((product) => product.category_slug === "ecouteurs").length,
    );
    expect(earbuds.every((product) => product.category_slug === "ecouteurs")).toBe(true);
    expect(earbuds.map(({ code }) => code)).toContain("app3");

    const redmi = searchCatalog(products, "Rédmi");
    expect(redmi).toHaveLength(
      products.filter((product) => product.brand_slug === "xiaomi").length,
    );
    expect(redmi.every((product) => product.brand_slug === "xiaomi")).toBe(true);
    expect(redmi.map(({ code }) => code)).toContain("rn15");
  });
});
