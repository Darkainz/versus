import { expect, test } from "@playwright/test";
import { brands, products } from "../src/data/catalog";
import { brandNames, productCount } from "../src/lib/catalog/summary";

/** Catalogue de démonstration élargi ; les comptes sont calculés depuis la source de données. */
test.describe("boutique", () => {
  test("affiche tout le catalogue, avec un compte calculé", async ({ page }) => {
    await page.goto("/boutique");
    await expect(page.locator("[data-product-card]")).toHaveCount(products.length);
    for (const brand of brands) {
      await expect(page.locator(`[data-product-card][data-brand="${brand.slug}"]`)).toHaveCount(
        products.filter((product) => product.brand_slug === brand.slug).length,
      );
    }
    await expect(page.locator("main h1 + p")).toContainText(
      `${productCount(products.length)} pour découvrir les univers ${brandNames(brands)}.`,
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      `Les ${productCount(products.length)} ${brandNames(brands)} de la boutique fictive VERSUS.`,
    );
  });

  test("chaque fiche produit répond", async ({ request }) => {
    for (const product of products) {
      const response = await request.get(`/produit/${product.slug}`);
      expect(response.status(), product.slug).toBe(200);
    }
  });

  test("l'ancre de la famille smartphones est présente sur la boutique", async ({ page }) => {
    await page.goto("/boutique#smartphones");
    await expect(page.locator("#smartphones")).toBeVisible();
  });

  test("les pages publiques ne définissent aucun cookie", async ({ request }) => {
    for (const path of ["/", "/produit/iphone-18-pro"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["set-cookie"], path).toBeUndefined();
    }
  });

  test("les anciennes adresses Samsung redirigent vers les noms officiels", async ({ request }) => {
    for (const [from, to] of [
      ["/produit/galaxy-buds-4", "/produit/galaxy-buds4"],
      ["/produit/galaxy-watch-9", "/produit/galaxy-watch9"],
    ] as const) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(308);
      expect(response.headers().location, from).toBe(to);
    }
  });
});
