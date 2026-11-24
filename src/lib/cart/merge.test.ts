import { describe, expect, it } from "vitest";
import { mergeCartLines, parseAccountCart } from "./merge";

describe("mergeCartLines", () => {
  it("fusionne les lignes par SKU sans additionner les quantités", () => {
    expect(
      mergeCartLines(
        [
          { sku: "AP5-BLA", qty: 2 },
          { sku: "SM-A57-BLK", qty: 1 },
        ],
        [{ sku: "AP5-BLA", qty: 1 }],
      ),
    ).toEqual({
      lines: [
        { sku: "AP5-BLA", qty: 2 },
        { sku: "SM-A57-BLK", qty: 1 },
      ],
      overflow: false,
    });
  });

  it("rejette les lignes invalides, ignore les prix et borne lignes et quantités", () => {
    expect(
      parseAccountCart([
        { sku: "AP5-BLA", qty: 9, price_fcfa: 1 },
        { sku: "../bad", qty: 1 },
        { sku: "SM-A57-BLK", qty: 1.5 },
      ]),
    ).toEqual([{ sku: "AP5-BLA", qty: 5 }]);
  });

  it("préserve les deux paniers et signale un dépassement plutôt que de perdre des SKU", () => {
    const lines = Array.from({ length: 20 }, (_, index) => ({
      sku: `SKU-${String(index).padStart(2, "0")}`,
      qty: 1,
    }));
    expect(mergeCartLines(lines, []).overflow).toBe(false);
    const result = mergeCartLines([...lines, { sku: "SKU-20", qty: 1 }], []);
    expect(result.overflow).toBe(true);
    expect(result.lines).toHaveLength(20);
  });
});
