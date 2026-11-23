import { describe, expect, it } from "vitest";
import type { CompareGroup } from "@/lib/catalog/types";
import { compareReducer, initialCompareState, type CompareProduct } from "./compare-reducer";

function product(code: string, group: CompareGroup = "phones"): CompareProduct {
  return { code, name: `Produit ${code}`, compare_group: group };
}

function addMany(...products: CompareProduct[]) {
  return products.reduce(
    (state, item) => compareReducer(state, { type: "add", product: item }),
    initialCompareState,
  );
}

describe("compareReducer", () => {
  it("conserve au plus trois produits distincts de la même famille", () => {
    const first = product("ip18");
    const second = product("s26");
    const third = product("x17");
    const fourth = product("a57");
    const state = addMany(first, second, third);

    expect(compareReducer(state, { type: "add", product: second })).toBe(state);

    const next = compareReducer(state, { type: "add", product: fourth });
    expect(next.products).toEqual([second, third, fourth]);
    expect(next.notice).toBe("Produit ip18 a été retiré du comparateur (3 produits maximum).");
  });

  it("demande confirmation avant de remplacer une famille sélectionnée", () => {
    const first = product("ip18");
    const second = product("s26");
    const otherFamily = product("gb4", "audio");
    const state = addMany(first, second);

    const pending = compareReducer(state, { type: "add", product: otherFamily });
    expect(pending.products).toEqual([first, second]);
    expect(pending.pendingProduct).toEqual(otherFamily);

    const cancelled = compareReducer(pending, { type: "cancelReplacement" });
    expect(cancelled.products).toEqual([first, second]);
    expect(cancelled.pendingProduct).toBeNull();

    const confirmed = compareReducer(pending, { type: "confirmReplacement" });
    expect(confirmed.products).toEqual([otherFamily]);
    expect(confirmed.activeGroup).toBe("audio");
    expect(confirmed.pendingProduct).toBeNull();
  });

  it("garde l’onglet actif quand on retire le dernier produit", () => {
    const state = addMany(product("ip18"));
    const next = compareReducer(state, { type: "remove", code: "ip18" });

    expect(next.products).toEqual([]);
    expect(next.activeGroup).toBe("phones");
  });

  it("efface une sélection en attente sans changer l’onglet actif", () => {
    const selected = product("ip18");
    const otherFamily = product("gb4", "audio");
    const pending = compareReducer(addMany(selected), { type: "add", product: otherFamily });

    const cleared = compareReducer(pending, { type: "clear" });
    expect(cleared.products).toEqual([]);
    expect(cleared.pendingProduct).toBeNull();
    expect(cleared.activeGroup).toBe("phones");
  });
});
