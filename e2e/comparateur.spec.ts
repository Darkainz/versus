import { expect, test } from "@playwright/test";

test.describe("comparateur", () => {
  test("complète un code seul et ouvre la famille demandée", async ({ page }) => {
    await page.goto("/comparer?p=gw9");

    await expect(page).toHaveURL(/\/comparer\?p=gw9%2Caw12%2Cxws5/);
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Galaxy Watch9/ })).toBeVisible();
    await expect(page.getByRole("table")).toContainText("Garantie indiquée");
  });

  test("le tiroir permet d'ajouter un produit puis de comparer", async ({ page }) => {
    await page.goto("/boutique");
    const card = page.locator('[data-product-card="ip18"]');

    await card.getByRole("button", { name: /au comparateur/i }).click();
    await expect(
      page.getByRole("complementary", { name: "Sélection du comparateur" }),
    ).toContainText("iPhone 18 Pro");

    await page
      .getByRole("complementary", { name: "Sélection du comparateur" })
      .getByRole("link", { name: "Comparer" })
      .click();
    await expect(page).toHaveURL(/\/comparer\?p=ip18/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("le filtre des différences est conservé dans l'URL", async ({ page }) => {
    await page.goto("/comparer?p=ip18,s26u");

    const toggle = page.getByRole("checkbox", { name: "Afficher uniquement les différences" });
    await toggle.click();

    await expect(page).toHaveURL(/\/comparer\?p=ip18%2Cs26u&diff=1/);
    await expect(toggle).toBeChecked();
  });

  test("le sélecteur remplace les produits comparés et conserve leurs codes dans l'URL", async ({
    page,
  }) => {
    await page.goto("/comparer?p=ip18,s26u");
    await page.getByText("Choisir les modèles à comparer").click();
    await page.getByLabel("Modèle 3").selectOption("x17u");
    await page.getByRole("button", { name: "Mettre à jour la sélection" }).click();

    await expect(page).toHaveURL(/\/comparer\?p=ip18%2Cs26u%2Cx17u/);
    await expect(page.getByRole("columnheader", { name: /Xiaomi 17 Ultra/ })).toBeVisible();
  });

  test("demande confirmation avant de changer de famille", async ({ page }) => {
    await page.goto("/boutique");
    await page
      .locator('[data-product-card="ip18"]')
      .getByRole("button", { name: /au comparateur/i })
      .click();
    await page
      .locator('[data-product-card="app3"]')
      .getByRole("button", { name: /au comparateur/i })
      .click();

    const dialog = page.getByRole("dialog", { name: "Remplacer la sélection ?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Annuler" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Sélection du comparateur" }),
    ).toContainText("iPhone 18 Pro");
  });

  test("signale le produit retiré quand on dépasse la limite de trois", async ({ page }) => {
    await page.goto("/boutique");
    for (const code of ["ip18", "s26u", "x17u", "a57"]) {
      await page
        .locator(`[data-product-card="${code}"]`)
        .getByRole("button", { name: /au comparateur/i })
        .click();
    }

    await expect(page.getByRole("status")).toContainText(
      "iPhone 18 Pro a été retiré du comparateur",
    );
    await page.getByRole("button", { name: "Fermer" }).click();
  });
  test("a un titre de page propre", async ({ page }) => {
    await page.goto("/comparer");
    await expect(page).toHaveTitle("Comparer | VERSUS");
  });

  // Régression : les options longues des sélecteurs (352 px) élargissaient la grille, d'où un
  // défilement horizontal de 16 px à 768 px et des sélecteurs rognés à 360 px.
  for (const width of [360, 390, 768, 1024]) {
    test(`le sélecteur de modèles reste dans la page à ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/comparer");
      // Un sélecteur par famille de produits : seul celui de la famille affichée est visible.
      await page.locator("summary:visible", { hasText: "Choisir les modèles à comparer" }).click();
      await expect(page.getByLabel("Modèle 1").locator("visible=true")).toBeVisible();
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        rights: [...document.querySelectorAll("select")]
          .filter((select) => select.getClientRects().length > 0)
          .map((select) => Math.round(select.getBoundingClientRect().right)),
      }));
      expect(state.overflow, JSON.stringify(state)).toBeLessThanOrEqual(0);
      for (const right of state.rights)
        expect(right, JSON.stringify(state)).toBeLessThanOrEqual(width);
    });
  }
});
