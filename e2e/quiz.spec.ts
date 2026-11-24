import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

test.describe("aide au choix sans JavaScript", () => {
  test("le formulaire de la page dédiée transmet son choix avec GET", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#aide")).toHaveCount(0);
    await page.goto("/aide-au-choix");
    const form = page.locator("form");

    await expect(form).toHaveAttribute("method", "get");
    await expect(form).toHaveAttribute("action", "/aide-au-choix");
    await form.getByLabel("Des écouteurs").check();
    await form.getByRole("button", { name: "Continuer" }).click();

    await expect(page).toHaveURL(/\/aide-au-choix\?type=audio$/);
    await expect(
      page.getByRole("group", { name: "Quel budget souhaitez-vous consacrer ?" }),
    ).toBeVisible();
    await expect(page.getByRole("radio", { name: "Un téléphone Android" })).toBeVisible();
  });

  test("affiche des recommandations puis ouvre le comparateur via des formulaires et liens natifs", async ({
    page,
  }) => {
    await page.goto("/aide-au-choix?type=audio");
    await page.getByRole("radio", { name: "100 000 FCFA ou plus" }).check();
    await page.getByRole("radio", { name: "Un téléphone Android" }).check();
    await page.getByRole("radio", { name: "L’autonomie" }).check();
    await page.getByRole("button", { name: "Voir mes recommandations" }).click();

    await expect(page).toHaveURL(
      /\/aide-au-choix\?type=audio&budget=over-100&tel=android&prio=autonomy$/,
    );
    await expect(page.getByRole("heading", { name: "Vos recommandations" })).toBeVisible();
    await expect(page.locator("#recommandations [data-quiz-product]")).toHaveCount(3);

    await page.getByRole("link", { name: "Comparer ces modèles" }).click();
    await expect(page).toHaveURL(/\/comparer\?p=/);
    await expect(page.getByRole("heading", { name: "Comparer les produits" })).toBeVisible();
  });

  test("signale des paramètres répétés ou invalides sans rediriger", async ({ page }) => {
    const response = await page.goto(
      "/aide-au-choix?type=audio&budget=over-100&budget=under-100&tel=ios&prio=autonomy",
    );

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(
      /\/aide-au-choix\?type=audio&budget=over-100&budget=under-100&tel=ios&prio=autonomy$/,
    );
    await expect(page.getByRole("alert")).toContainText(
      "Certaines réponses sont manquantes ou invalides",
    );
    await expect(page.locator("#recommandations")).toHaveCount(0);
  });
});
