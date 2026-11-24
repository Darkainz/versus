import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { CART_STORAGE_KEY } from "../src/lib/cart/storage";

async function seedCart(page: Page) {
  await page.goto("/mentions-legales");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      lines: [{ sku: "AP5-BLA", qty: 1 }],
      zone: "lome",
    }),
  ] as const);
}

test("parcourt les quatre étapes et exige l'accord de simulation avant envoi", async ({ page }) => {
  await seedCart(page);
  await page.goto("/commande");
  await expect(page.getByRole("heading", { name: "Finaliser la commande" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Étapes de la commande" })).toBeVisible();

  await page.getByLabel("Nom complet").fill("Ama Mensah");
  await page.getByLabel("Téléphone").fill("+228 90 12 34 56");
  await page.getByRole("button", { name: "Continuer" }).click();

  await page.getByLabel("Ville").fill("Lomé");
  await page.getByLabel("Quartier").fill("Tokoin");
  await page.getByLabel("Repère pour la livraison").fill("Près du marché");
  await page.getByRole("button", { name: "Continuer" }).click();

  await expect(page.getByRole("radio", { name: /T-Money/ })).toBeChecked();
  await expect(page.getByText(/aucune donnée de carte ne sera demandée/i)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();

  const consent = page.getByRole("checkbox", {
    name: "J’ai compris qu’il s’agit d’une simulation sans vente ni paiement réel.",
  });
  await expect(consent).not.toBeChecked();
  expect(await consent.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(
    false,
  );
  await consent.check();
  expect(await consent.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(true);

  await expect(page.getByRole("button", { name: "Confirmer la commande fictive" })).toBeEnabled();
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id} : ${violation.help}`),
  ).toEqual([]);
});

test("le suivi expose un formulaire sans données personnelles dans l'URL", async ({ page }) => {
  await page.goto("/suivi");
  await expect(page.getByRole("heading", { name: "Suivre une commande" })).toBeVisible();
  await expect(page.getByLabel("Numéro de commande")).toBeVisible();
  await expect(page.getByLabel("Téléphone utilisé à la commande")).toBeVisible();
  expect(new URL(page.url()).search).toBe("");

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map(
        (violation) =>
          `${violation.id} : ${violation.help} — ${violation.nodes
            .map((node) => `${node.target.join(" ")} (${node.failureSummary})`)
            .join("; ")}`,
      ),
  ).toEqual([]);
});
