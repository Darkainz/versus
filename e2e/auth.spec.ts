import { expect, test } from "@playwright/test";

test("l'inscription exige la confidentialité et propose un profil facultatif", async ({ page }) => {
  await page.goto("/inscription");
  await expect(page.getByRole("heading", { name: "Créer un compte" })).toBeVisible();
  await expect(page.getByLabel("Nom complet")).toBeVisible();
  await expect(page.getByLabel("Téléphone (facultatif)")).toBeVisible();

  const consent = page.getByRole("checkbox", {
    name: "J’accepte la politique de confidentialité.",
  });
  await expect(consent).not.toBeChecked();
  expect(await consent.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(
    false,
  );
  await expect(page.getByRole("link", { name: "politique de confidentialité" })).toHaveAttribute(
    "href",
    "/confidentialite",
  );
});

test("une page de compte protège l'accès et conserve la destination de retour", async ({
  page,
}) => {
  await page.goto("/compte");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte");

  await page.goto("/compte/profil");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte/profil");

  await page.goto("/compte/commandes");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte/commandes");

  await page.goto("/compte/adresses");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte/adresses");

  await page.goto("/compte/commandes/VS-2026-000001");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte/commandes/VS-2026-000001");

  await page.goto("/compte/donnees");
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("redirect")).toBe("/compte/donnees");
});

test("le formulaire de récupération indique que l'envoi est limité à la démonstration", async ({
  page,
}) => {
  await page.goto("/mot-de-passe-oublie");
  await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
  await expect(page.getByText(/lien de réinitialisation est envoyé dans Mailpit/i)).toBeVisible();
});
