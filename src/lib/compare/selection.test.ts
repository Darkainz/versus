import { describe, expect, it } from "vitest";
import { homeSlots, products } from "@/data/catalog";
import { resolveCompareSelection } from "./selection";

const byCode = new Map(products.map((product) => [product.code, product]));
const homeCompareProducts = homeSlots
  .filter((slot) => slot.slot === "compare")
  .flatMap((slot) => {
    const product = byCode.get(slot.product_code);
    return product ? [product] : [];
  });

function codes(selection: readonly { code: string }[]) {
  return selection.map(({ code }) => code);
}

describe("resolveCompareSelection", () => {
  it("utilise les emplacements du comparateur d'accueil sans paramètre", () => {
    expect(codes(resolveCompareSelection(undefined, products, homeCompareProducts))).toEqual(
      homeCompareProducts.map(({ code }) => code),
    );
  });

  it("complète un code seul avec les produits d'accueil de sa famille, sans le déplacer", () => {
    expect(codes(resolveCompareSelection(["gw9"], products, homeCompareProducts))).toEqual([
      "gw9",
      "aw12",
      "xws5",
    ]);
  });

  it("conserve deux codes valides dans l'ordre demandé", () => {
    expect(codes(resolveCompareSelection(["rn15", "ip18"], products, homeCompareProducts))).toEqual(
      ["rn15", "ip18"],
    );
  });

  it("conserve les trois premiers codes valides demandés", () => {
    expect(
      codes(resolveCompareSelection(["ip18", "s26u", "x17u"], products, homeCompareProducts)),
    ).toEqual(["ip18", "s26u", "x17u"]);
  });

  it("ignore les codes inconnus, les doublons et les familles après la première", () => {
    expect(
      codes(
        resolveCompareSelection(
          ["unknown", "gw9", "ip18", "gw9", "aw12"],
          products,
          homeCompareProducts,
        ),
      ),
    ).toEqual(["gw9", "aw12"]);
  });

  it("limite à trois codes et renvoie une sélection vide si aucun code n'est actif", () => {
    expect(
      codes(
        resolveCompareSelection(["ip18", "s26u", "x17u", "a57"], products, homeCompareProducts),
      ),
    ).toEqual(["ip18", "s26u", "x17u"]);
    expect(codes(resolveCompareSelection(["unknown"], products, homeCompareProducts))).toEqual([]);
  });
});
