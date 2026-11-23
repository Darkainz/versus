import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { searchCatalog } from "./search";

describe("searchCatalog", () => {
  it("ignore les accents et trouve les produits par catégorie ou marque", () => {
    expect(searchCatalog(products, "ecouteur").map(({ code }) => code)).toEqual([
      "apm2",
      "app3",
      "ap5",
      "gb4p",
      "gb4",
      "xb6",
      "rb8",
    ]);
    expect(searchCatalog(products, "Rédmi").map(({ code }) => code)).toEqual([
      "x17u",
      "x17",
      "x17tp",
      "rn15",
      "xb6",
      "rb8",
      "xws5",
      "rw6",
      "sb10p",
      "sb10",
    ]);
  });
});
