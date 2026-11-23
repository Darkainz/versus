import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import type { Database } from "../src/lib/database.types";
import { CART_STORAGE_KEY } from "../src/lib/cart/storage";

const enabled = process.env.RUN_LOCAL_ACCOUNT_E2E === "1";

function localClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !publishableKey || !secretKey) {
    throw new Error("La configuration Supabase locale est absente.");
  }

  const endpoint = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    throw new Error("Les tests de compte locaux refusent tout endpoint Supabase distant.");
  }

  const publicClient = createClient<Database>(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const adminClient = createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return { publicClient, adminClient };
}

function localSql(query: string) {
  return execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_versus",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atc",
      query,
    ],
    { encoding: "utf8" },
  ).trim();
}

function sqlText(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

test("Compte local : adresses, fusion du panier et rattachement invité", async ({ page }) => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  test.setTimeout(90_000);

  const { publicClient, adminClient } = localClients();
  const email = `versus-account-${randomUUID()}@example.test`;
  const password = `Compte-${randomUUID()}!`;
  const fullName = "VERSUS compte local";
  const phoneDigits = "90" + randomUUID().replaceAll("-", "").replace(/\D/g, "").slice(0, 6);
  const phone = `+228${phoneDigits}`;
  let userId: string | undefined;
  let guestNumber: string | undefined;

  try {
    await page.goto("/inscription");
    await page.getByLabel("Nom complet").fill(fullName);
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByLabel("Téléphone (facultatif)").fill(phone);
    await page.getByRole("checkbox", { name: /J’accepte la politique de confidentialité/ }).check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/compte\/?$/);

    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    if (usersError) throw usersError;
    const user = users.users.find((candidate) => candidate.email === email);
    if (!user) throw new Error("Le compte d’essai n’a pas été créé.");
    userId = user.id;
    await expect
      .poll(() =>
        localSql(`select count(*)::text from public.profiles where id = '${userId}'::uuid;`),
      )
      .toBe("1");

    await page.goto("/compte/adresses");
    await page.getByLabel("Nom de l’adresse").fill("Résidence test");
    await page.getByLabel("Nom du destinataire").fill(fullName);
    await page.getByLabel("Téléphone").fill(phone);
    await page.getByLabel("Zone de livraison").selectOption("lome");
    await page.getByLabel("Ville").fill("Lomé");
    await page.getByLabel("Quartier").fill("Tokoin");
    await page.getByLabel("Repère / indication").fill("Test local");
    await page.getByLabel("Utiliser comme adresse par défaut").check();
    await page.getByRole("button", { name: "Ajouter l’adresse" }).click();
    await expect(page.getByRole("status")).toContainText("Adresse enregistrée.");
    await expect(page.getByText("Résidence test · Par défaut")).toBeVisible();

    localSql(`
      insert into public.carts (user_id, items)
      values (
        '${userId}'::uuid,
        '[{"sku":"AP5-BLA","qty":1}]'::jsonb
      )
      on conflict (user_id) do update
      set items = excluded.items,
          updated_at = pg_catalog.now();
    `);

    await page.goto("/mentions-legales");
    await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
      CART_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        lines: [{ sku: "APP3-BLA", qty: 1 }],
        zone: "lome",
      }),
    ] as const);
    await page.goto("/panier");
    await expect
      .poll(async () => {
        if (!userId) throw new Error("L’identifiant du compte d’essai est absent.");
        return localSql(`
          select (
            items @> '[{"sku":"AP5-BLA","qty":1}]'::jsonb
            and items @> '[{"sku":"APP3-BLA","qty":1}]'::jsonb
          )::text
          from public.carts
          where user_id = '${userId}'::uuid;
        `);
      })
      .toBe("true");

    const guestName = `VERSUS invité ${randomUUID()}`;
    const guestPhone = `+228${"9" + randomUUID().replaceAll("-", "").replace(/\D/g, "").slice(0, 7)}`;
    const guest = await publicClient.rpc("create_order", {
      p_idempotency_key: randomUUID(),
      p_items: [{ sku: "AP5-BLA", qty: 1 }],
      p_customer: { name: guestName, phone: guestPhone, email: null },
      p_delivery: {
        zone_code: "lome",
        city: "Lomé",
        district: "Tokoin",
        landmark: "Test local",
        instructions: null,
      },
      p_method: "card",
      p_fictitious_ack: true,
    });
    if (guest.error || !guest.data?.[0])
      throw guest.error ?? new Error("Commande invitée absente.");

    const created = guest.data[0];
    guestNumber = created.order_number;
    const payment = await publicClient.rpc("start_payment", {
      p_number: created.order_number,
      p_token: created.access_token,
      p_method: "card",
    });
    if (payment.error || !payment.data?.[0]) {
      throw payment.error ?? new Error("Simulation de paiement absente.");
    }

    const resolved = await publicClient.rpc("resolve_payment", {
      p_number: created.order_number,
      p_token: created.access_token,
      p_reference: payment.data[0].reference,
      p_outcome: "succeeded",
    });
    if (resolved.error || !resolved.data) {
      throw resolved.error ?? new Error("Paiement simulé non résolu.");
    }

    await page.context().addCookies([
      {
        name: `vs_ot_${created.order_number}`,
        value: created.access_token,
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto(`/commande/${created.order_number}/confirmation`);
    await expect(
      page.getByRole("button", { name: "Rattacher cette commande à mon compte" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Rattacher cette commande à mon compte" }).click();
    await expect(page.getByRole("status")).toContainText("Commande rattachée à votre compte.");

    expect(
      localSql(`
        select coalesce(user_id::text, '')
        from public.orders
        where number = ${sqlText(created.order_number)};
      `),
    ).toBe(userId);

    await page.goto("/compte/commandes");
    await expect(
      page.getByRole("link", { name: `Commande ${created.order_number}`, exact: true }),
    ).toBeVisible();
  } finally {
    if (guestNumber) {
      localSql(`
        do $cleanup$
        declare
          v_order record;
        begin
          select * into v_order from public.orders where number = ${sqlText(guestNumber)};
          if found then
            if v_order.status <> 'cancelled' then
              perform private.release_order_stock(v_order.id, 'order_cancelled');
            end if;
            delete from public.stock_movements where order_id = v_order.id;
            delete from public.orders where id = v_order.id;
          end if;
        end;
        $cleanup$;
      `);
    }
    if (userId) {
      localSql(`
        delete from public.addresses where user_id = '${userId}'::uuid;
        delete from public.carts where user_id = '${userId}'::uuid;
        delete from public.profiles where id = '${userId}'::uuid;
      `);
      await adminClient.auth.admin.deleteUser(userId);
    }
  }
});
