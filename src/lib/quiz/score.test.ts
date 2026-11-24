import { describe, expect, it } from "vitest";
import { products } from "@/data/catalog";
import type { ProductDetail } from "@/lib/catalog/types";
import type { QuizAnswers, QuizBudget, QuizPhone, QuizPriority, QuizType } from "./questions";
import { scoreProducts } from "./score";

function answers(
  type: QuizType,
  budget: QuizBudget,
  options: { phone?: QuizPhone; priority?: QuizPriority } = {},
): QuizAnswers {
  return { type, budget, ...options };
}

function codes(result: ReturnType<typeof scoreProducts>) {
  return result.recommendations.map(({ product }) => product.code);
}

const originalCatalog = products.slice(0, 30);

function product(code: string): ProductDetail {
  const found = products.find((item) => item.code === code);
  if (!found) throw new Error(`Produit de test introuvable : ${code}`);
  return found;
}

describe("scoreProducts", () => {
  it("keeps smartphones in the selected budget band", () => {
    const result = scoreProducts(originalCatalog, answers("phones", "300-500"));
    expect(codes(result)).toEqual(["a57", "rn15"]);
    expect(result.withinBudgetCount).toBe(2);
  });

  it("excludes products below a smartphone budget band", () => {
    const result = scoreProducts(originalCatalog, answers("phones", "over-500"));
    expect(codes(result)).not.toContain("a57");
    expect(codes(result)).not.toContain("rn15");
  });

  it("includes the exact lower edge of the 300–500 thousand band", () => {
    const result = scoreProducts(
      originalCatalog.map((product) =>
        product.code === "a57" ? { ...product, min_price_fcfa: 300_000 } : product,
      ),
      answers("phones", "300-500"),
    );
    expect(codes(result)).toContain("a57");
  });

  it("includes the exact upper edge of the 300–500 thousand band", () => {
    const result = scoreProducts(
      originalCatalog.map((product) =>
        product.code === "a57" ? { ...product, min_price_fcfa: 500_000 } : product,
      ),
      answers("phones", "300-500"),
    );
    expect(codes(result)).toContain("a57");
  });

  it("returns the two closest phones as out of budget when the band is empty", () => {
    const result = scoreProducts(originalCatalog, answers("phones", "under-300"));
    expect(codes(result)).toEqual(["a57", "rn15"]);
    expect(result.recommendations.every(({ outOfBudget }) => outOfBudget)).toBe(true);
    expect(result.withinBudgetCount).toBe(0);
  });

  it("returns no recommendations when every candidate is incompatible", () => {
    const result = scoreProducts(
      [product("aw12")],
      answers("wearables", "over-150", { phone: "android" }),
    );
    expect(result.compatibleCount).toBe(0);
    expect(result.recommendations).toEqual([]);
  });

  it("excludes Apple Watch models for Android users", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("wearables", "over-150", { phone: "android" }),
    );
    expect(codes(result)).not.toContain("awu4");
    expect(codes(result)).not.toContain("aw12");
    expect(codes(result)).not.toContain("awse3");
  });

  it("excludes Galaxy wearables for iPhone users", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("wearables", "over-150", { phone: "ios" }),
    );
    expect(codes(result)).not.toContain("gwu2");
    expect(codes(result)).not.toContain("gw9");
    expect(codes(result)).not.toContain("gf3");
  });

  it("keeps Apple Watch models for iPhone users", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("wearables", "over-150", { phone: "ios" }),
    );
    expect(codes(result)).toContain("awu4");
    expect(codes(result)).toContain("aw12");
  });

  it("never marks AirPods as ideal for Android users", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("audio", "under-100", { phone: "android" }),
    );
    expect(
      result.recommendations.some(
        ({ product, ideal }) => product.name.startsWith("AirPods") && ideal,
      ),
    ).toBe(false);
  });

  it("can recommend AirPods as ideal in the iPhone ecosystem", () => {
    const result = scoreProducts(originalCatalog, answers("audio", "over-100", { phone: "ios" }));
    expect(result.recommendations[0]?.product.code).toBe("app3");
    expect(result.recommendations[0]?.ideal).toBe(true);
  });

  it("uses the chosen phone ecosystem to prefer compatible earbuds", () => {
    const android = scoreProducts(
      originalCatalog,
      answers("audio", "over-100", { phone: "android" }),
    );
    const ios = scoreProducts(originalCatalog, answers("audio", "over-100", { phone: "ios" }));
    expect(android.recommendations[0]?.product.brand_slug).not.toBe("apple");
    expect(ios.recommendations[0]?.product.brand_slug).toBe("apple");
  });

  it("does not apply phone compatibility filtering when no phone is selected", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("wearables", "over-150", { phone: "none" }),
    );
    expect(result.compatibleCount).toBe(10);
    expect(codes(result)).toContain("aw12");
    expect(codes(result)).toContain("gw9");
  });

  it("uses photo priority to rank camera-focused smartphones", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("phones", "over-500", { priority: "camera" }),
    );
    expect(result.recommendations[0]?.product.code).toBe("s26u");
  });

  it("uses autonomy priority to rank smartphones", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("phones", "over-500", { priority: "autonomy" }),
    );
    expect(result.recommendations[0]?.product.code).toBe("ip18");
  });

  it("uses storage priority to rank smartphones", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("phones", "over-500", { priority: "storage" }),
    );
    expect(result.recommendations[0]?.product.code).toBe("ipd");
  });

  it("uses autonomy priority for Android wearables", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("wearables", "over-150", { phone: "android", priority: "autonomy" }),
    );
    expect(result.recommendations[0]?.product.code).toBe("gwu2");
  });

  it("uses price priority for earbuds", () => {
    const result = scoreProducts(
      originalCatalog,
      answers("audio", "over-100", { priority: "price" }),
    );
    expect(result.recommendations[0]?.product.code).toBe("gb4");
  });

  it("ignores products from a different family", () => {
    const phone = product("ip18");
    const audio = products.filter((product) => product.compare_group === "audio");
    const result = scoreProducts([...audio, phone], answers("audio", "over-100"));
    expect(result.compatibleCount).toBe(audio.length);
    expect(codes(result)).not.toContain("ip18");
  });

  it("does not recommend a product with no price as in-budget", () => {
    const noPrice = {
      ...product("app3"),
      min_price_fcfa: null,
      max_price_fcfa: null,
    } satisfies ProductDetail;
    const result = scoreProducts([noPrice], answers("audio", "over-100"));
    expect(result.withinBudgetCount).toBe(0);
    expect(result.recommendations[0]?.outOfBudget).toBe(true);
  });

  it("throws for an unknown budget identifier instead of silently scoring", () => {
    expect(() =>
      scoreProducts(originalCatalog, answers("phones", "not-a-budget" as QuizBudget)),
    ).toThrow("Tranche de budget inconnue");
  });

  it("includes new catalog models when they fit the selected budget", () => {
    const result = scoreProducts(products, answers("phones", "300-500"));
    expect(codes(result)).toContain("galaxya275g");
    expect(result.withinBudgetCount).toBeGreaterThan(2);
  });
});
