import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import type { Database } from "../src/lib/database.types";

const enabled = process.env.RUN_LOCAL_AUTH_E2E === "1";

function localAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("La configuration Supabase locale est absente.");

  const endpoint = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    throw new Error("Les tests Auth locaux refusent tout endpoint Supabase distant.");
  }

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test("Auth locale : inscription, récupération Mailpit et suppression du compte", async ({
  page,
  request,
}) => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  test.setTimeout(90_000);

  const admin = localAdminClient();
  const email = `versus-e2e-${randomUUID()}@example.test`;
  const initialPassword = `Initial-${randomUUID()}!`;
  const newPassword = `Nouveau-${randomUUID()}!`;
  const fullName = "VERSUS E2E confidentialité";
  const mailpitUrl = new URL(process.env.MAILPIT_URL ?? "http://127.0.0.1:55324");
  if (!["127.0.0.1", "localhost"].includes(mailpitUrl.hostname)) {
    throw new Error("Les tests Auth locaux refusent tout endpoint Mailpit distant.");
  }

  let userId: string | undefined;
  let accountDeleted = false;

  try {
    await page.goto("/inscription");
    await page.getByLabel("Nom complet").fill(fullName);
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(initialPassword);
    await page.getByRole("checkbox", { name: /J’accepte la politique de confidentialité/ }).check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/compte\/?$/);

    const { data: users, error: usersError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    if (usersError) throw usersError;
    const user = users.users.find((candidate) => candidate.email === email);
    if (!user) throw new Error("Le compte d’essai n’a pas été créé dans Supabase Auth.");
    userId = user.id;

    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByRole("button", { name: "Envoyer le lien" }).click();
    await expect(page.getByRole("status")).toContainText(
      "un lien de réinitialisation a été envoyé dans Mailpit",
    );

    let messageId: string | undefined;
    for (let attempt = 0; attempt < 30 && !messageId; attempt += 1) {
      const response = await request.get(
        new URL("/api/v1/messages?limit=100", mailpitUrl).toString(),
      );
      if (!response.ok()) throw new Error("Mailpit n’a pas pu être interrogé.");
      const body = (await response.json()) as {
        messages?: {
          ID?: string;
          id?: string;
          Subject?: string;
          To?: { Address?: string }[];
        }[];
      };
      const recoveryMessage = body.messages?.find(
        (message) =>
          message.Subject?.includes("Réinitialisez votre mot de passe VERSUS") &&
          message.To?.some((recipient) => recipient.Address?.toLowerCase() === email),
      );
      messageId = recoveryMessage?.ID ?? recoveryMessage?.id;
      if (!messageId) await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!messageId) throw new Error("Mailpit n’a pas reçu le courriel de récupération.");

    const messageResponse = await request.get(
      new URL(`/api/v1/message/${encodeURIComponent(messageId)}`, mailpitUrl).toString(),
    );
    if (!messageResponse.ok()) throw new Error("Le courriel de récupération est introuvable.");
    const message = (await messageResponse.json()) as { HTML?: string };
    const rawLink = message.HTML?.match(/href=["']([^"']*\/auth\/confirm\?[^"']*)["']/i)?.[1];
    if (!rawLink) throw new Error("Le courriel ne contient pas de lien de récupération.");

    const recoveryUrl = new URL(rawLink.replaceAll("&amp;", "&"));
    expect(["127.0.0.1", "localhost"]).toContain(recoveryUrl.hostname);
    expect(recoveryUrl.searchParams.get("type")).toBe("recovery");
    expect(recoveryUrl.searchParams.get("next")).toBe("/reinitialiser-mot-de-passe");

    await page.goto(recoveryUrl.href);
    await expect(page).toHaveURL(/\/reinitialiser-mot-de-passe/);
    await page.getByLabel("Nouveau mot de passe").fill(newPassword);
    await page.getByLabel("Confirmer le mot de passe").fill(newPassword);
    await page.getByRole("button", { name: "Enregistrer le nouveau mot de passe" }).click();
    await expect(page).toHaveURL(/\/compte\/profil\?mot-de-passe=modifie/);

    const browser = page.context().browser();
    if (!browser) throw new Error("Le navigateur E2E n’est pas disponible.");
    const accountContext = await browser.newContext();
    try {
      const accountPage = await accountContext.newPage();
      await accountPage.goto("http://localhost:3000/connexion");
      await accountPage.getByLabel("Adresse e-mail").fill(email);
      await accountPage.getByLabel("Mot de passe").fill(initialPassword);
      await accountPage.getByRole("button", { name: "Se connecter" }).click();
      await expect(
        accountPage.getByText("E-mail ou mot de passe incorrect.", { exact: true }),
      ).toBeVisible();

      await accountPage.goto("http://localhost:3000/connexion");
      await accountPage.getByLabel("Adresse e-mail").fill(email);
      await accountPage.getByLabel("Mot de passe").fill(newPassword);
      await accountPage.getByRole("button", { name: "Se connecter" }).click();
      await expect(accountPage).toHaveURL(/\/compte\/?$/);
      await accountPage.goto("http://localhost:3000/compte/donnees");

      const exportResult = await accountPage.evaluate(async () => {
        const response = await fetch("/compte/donnees/export");
        return {
          status: response.status,
          cacheControl: response.headers.get("cache-control"),
          contentDisposition: response.headers.get("content-disposition"),
          body: await response.json(),
        };
      });
      expect(exportResult.status).toBe(200);
      expect(exportResult.cacheControl).toBe("no-store");
      expect(exportResult.contentDisposition).toContain("attachment");
      expect(exportResult.body.profile.full_name).toBe(fullName);

      await accountPage.getByLabel("Saisissez SUPPRIMER pour confirmer").fill("SUPPRIMER");
      await accountPage.getByRole("button", { name: "Supprimer mon compte" }).click();
      await expect(accountPage).toHaveURL("http://localhost:3000/");

      const { data: deletedUser } = await admin.auth.admin.getUserById(userId);
      expect(deletedUser.user).toBeNull();
      accountDeleted = true;

      await accountPage.goto("http://localhost:3000/connexion");
      await accountPage.getByLabel("Adresse e-mail").fill(email);
      await accountPage.getByLabel("Mot de passe").fill(newPassword);
      await accountPage.getByRole("button", { name: "Se connecter" }).click();
      await expect(
        accountPage.getByText("E-mail ou mot de passe incorrect.", { exact: true }),
      ).toBeVisible();
    } finally {
      await accountContext.close();
    }
  } finally {
    let cleanupUserId = userId;
    if (!cleanupUserId && !accountDeleted) {
      const { data: users, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });
      if (usersError) throw usersError;
      cleanupUserId = users.users.find((user) => user.email === email)?.id;
    }
    if (cleanupUserId && !accountDeleted) {
      const { error } = await admin.auth.admin.deleteUser(cleanupUserId);
      if (error && error.status !== 404) throw error;
    }
  }
});
