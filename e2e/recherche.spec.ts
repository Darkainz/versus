import { expect, test } from "@playwright/test";
import { products } from "../src/data/catalog";
import { filterCatalog } from "../src/lib/catalog/filter";
import { searchCatalog } from "../src/lib/catalog/search";

/**
 * Les attentes se calculent à partir du catalogue, avec les fonctions de la page. La recherche
 * lit les lignes de la vue `catalog_products` : ni description ni variantes.
 */
const rows = products.map(({ code, name, tagline, brand_name, brand_slug, category_slug }) => ({
  code,
  name,
  tagline,
  brand_name,
  brand_slug,
  category_slug,
}));

test.describe("recherche du catalogue", () => {
  test("trouve les écouteurs sans accent", async ({ page }) => {
    await page.goto("/recherche?q=ecouteur");

    await expect(
      page.getByRole("heading", { level: 1, name: "Que cherchez-vous ?" }),
    ).toBeVisible();
    const codes = searchCatalog(rows, "ecouteur").map((product) => product.code);
    expect(codes.length, "le catalogue a des écouteurs").toBeGreaterThan(0);
    for (const code of ["apm2", "app3", "ap5", "gb4p", "gb4", "xb6", "rb8"]) {
      expect(codes, `${code} reste trouvé`).toContain(code);
    }
    await expect(page.getByText(`${codes.length} résultats pour « ecouteur »`)).toBeVisible();
    await expect(page.locator("[data-product-card]")).toHaveCount(codes.length);
    for (const code of codes) {
      await expect(page.locator(`[data-product-card="${code}"]`)).toHaveCount(1);
    }
  });

  test("redmi, accentué ou non, trouve le Redmi Note 15 Pro+", async ({ page }) => {
    for (const query of ["redmi", "Rédmi"]) {
      await page.goto(`/recherche?q=${encodeURIComponent(query)}`);

      await expect(page.locator('[data-product-card="rn15"]')).toHaveCount(1);
      await expect(
        page.locator('[data-product-card="rn15"]').getByRole("link", {
          name: "Voir le produit Redmi Note 15 Pro+ 5G",
        }),
      ).toHaveAttribute("href", "/produit/redmi-note-15-pro-plus-5g");
    }
  });
});

test("les filtres de la boutique se soumettent et restent dans l’URL", async ({ page }) => {
  await page.goto("/boutique");
  const filters = page.getByRole("form", { name: "Filtres du catalogue" });

  await filters.getByLabel("Catégorie").selectOption("montres");
  await filters.getByLabel("Xiaomi").check();
  await filters.getByLabel("Minimum").fill("50000");
  await filters.getByLabel("Maximum").fill("100000");
  await filters.getByLabel("Trier par").selectOption("price-asc");
  await filters.getByLabel("Disponibles uniquement").check();
  await filters.getByRole("button", { name: "Appliquer" }).click();

  await expect(page).toHaveURL(/\/boutique\?.*category=montres/);
  await expect(page).toHaveURL(/brand=xiaomi/);
  await expect(page).toHaveURL(/minPrice=50000/);
  await expect(page).toHaveURL(/maxPrice=100000/);
  await expect(page).toHaveURL(/sort=price-asc/);
  await expect(page).toHaveURL(/inStock=1/);
  const expected = filterCatalog(products, {
    category: "montres",
    brands: ["xiaomi"],
    minPrice: 50_000,
    maxPrice: 100_000,
    inStock: true,
    sort: "price-asc",
  }).map((product) => product.code);
  expect(expected, "rw6 reste dans la sélection").toContain("rw6");
  const cards = page.locator("[data-product-card]");
  await expect(cards).toHaveCount(expected.length);
  // Même sélection, dans l'ordre du tri par prix croissant.
  await expect
    .poll(() => cards.evaluateAll((els) => els.map((el) => el.getAttribute("data-product-card"))))
    .toEqual(expected);

  await expect(
    page.getByRole("form", { name: "Filtres du catalogue" }).getByLabel("Catégorie"),
  ).toHaveValue("montres");
});
