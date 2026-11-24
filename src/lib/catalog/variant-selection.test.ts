import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import { selectVariant } from "./variant-selection";

const iphone = products[0];

describe("selectVariant", () => {
  it("choisit la variante par défaut et conserve les paramètres partiels valides", () => {
    if (!iphone) throw new Error("Fixture iPhone manquante.");
    expect(selectVariant(iphone.variants, {}).variant.is_default).toBe(true);
    const defaultVariant = iphone.variants.find((v) => v.is_default);
    expect(selectVariant(iphone.variants, {}).variant.sku).toBe(defaultVariant?.sku);
  });

  it("signale une combinaison inconnue et revient à la variante active par défaut", () => {
    if (!iphone) throw new Error("Fixture iPhone manquante.");
    const selection = selectVariant(iphone.variants, { couleur: "inexistant", stockage: "999" });
    expect(selection.invalidSelection).toBe(true);
  });

  it("revient à la première variante active si la variante par défaut est désactivée", () => {
    if (!iphone) throw new Error("Fixture iPhone manquante.");
    const defaultVariant = iphone.variants.find((v) => v.is_default);
    const variants = iphone.variants.map((variant) => ({
      ...variant,
      is_active: variant.sku !== defaultVariant?.sku,
    }));
    const selection = selectVariant(variants, { couleur: "inconnue" });
    expect(selection.variant.is_active).toBe(true);
    expect(selection.variant.sku).not.toBe(defaultVariant?.sku);
  });
});
