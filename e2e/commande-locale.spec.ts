import { execFileSync } from "node:child_process";
import { randomInt, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { CART_STORAGE_KEY } from "../src/lib/cart/storage";
import type { Database } from "../src/lib/database.types";

const enabled = process.env.RUN_LOCAL_ORDER_E2E === "1";
const testSku = "AP5-BLA";

type TestCustomer = { name: string; phone: string };

function localClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("La configuration Supabase locale est absente.");

  const endpoint = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    throw new Error("Les tests de commande locale refusent tout endpoint Supabase distant.");
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

function cleanupTestData(customers: readonly TestCustomer[]) {
  const predicates = customers
    .map(
      ({ name, phone }) =>
        `(orders.customer_name = ${sqlText(name)} and orders.customer_phone = ${sqlText(phone)})`,
    )
    .join(" or ");
  const phones = customers.map(({ phone }) => sqlText(phone)).join(", ");

  localSql(`
    do $cleanup$
    declare
      v_order record;
    begin
      for v_order in
        select orders.id, orders.status from public.orders where ${predicates}
      loop
        if v_order.status <> 'cancelled' then
          perform private.release_order_stock(v_order.id, 'order_cancelled');
        end if;
        delete from public.stock_movements where order_id = v_order.id;
        delete from public.orders where id = v_order.id;
      end loop;
      delete from private.order_attempts where phone in (${phones});
    end
    $cleanup$;
  `);
}

async function seedCart(page: Page) {
  await page.goto("/mentions-legales");
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [
    CART_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      lines: [{ sku: testSku, qty: 1 }],
      zone: "lome",
    }),
  ] as const);
}

function newTestCustomer(): TestCustomer & { formattedPhone: string } {
  const digits = String(randomInt(0, 100_000_000)).padStart(8, "0");
  return {
    name: `VERSUS E2E ${randomUUID()}`,
    phone: `+228${digits}`,
    formattedPhone: `+228 ${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6)}`,
  };
}

test("commande locale : création, refus Flooz, validation T-Money et nettoyage", async ({
  page,
}) => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  localClient();

  const customer = newTestCustomer();
  const initialStock = Number(
    localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
  );
  expect(initialStock).toBeGreaterThan(0);

  try {
    await seedCart(page);
    await page.goto("/commande");
    await page.getByLabel("Nom complet").fill(customer.name);
    await page.getByLabel("Téléphone").fill(customer.formattedPhone);
    await page.getByRole("button", { name: "Continuer" }).click();

    await page.getByLabel("Ville").fill("Lomé");
    await page.getByLabel("Quartier").fill("Tokoin");
    await page.getByLabel("Repère pour la livraison").fill("Test local");
    await page.getByRole("button", { name: "Continuer" }).click();

    await page.getByRole("radio", { name: /Flooz/ }).check();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page
      .getByRole("checkbox", {
        name: "J’ai compris qu’il s’agit d’une simulation sans vente ni paiement réel.",
      })
      .check();
    await page.getByRole("button", { name: "Confirmer la commande fictive" }).click();

    await expect(page).toHaveURL(/\/commande\/VS-\d{4}-\d{6}\/paiement$/);
    await page.getByLabel("Moyen de paiement").selectOption("flooz");
    await page.getByLabel(/Téléphone mobile money/).fill(customer.formattedPhone);
    await page.getByRole("button", { name: "Démarrer la simulation" }).click();
    await expect(page.getByRole("heading", { name: "Paiement simulé en attente" })).toBeVisible();

    await page.getByRole("button", { name: "Simuler un refus" }).click();
    await expect(page.getByRole("heading", { name: "Réessayer la simulation" })).toBeVisible();

    await page.getByLabel("Moyen de paiement").selectOption("tmoney");
    await page.getByLabel(/Téléphone mobile money/).fill(customer.formattedPhone);
    await page.getByRole("button", { name: "Démarrer la simulation" }).click();
    await expect(page.getByRole("group", { name: "T-Money simulé" })).toBeVisible();
    await page.getByRole("button", { name: "Simuler la validation" }).click();
    await expect(
      page.getByRole("heading", { name: "Merci, votre simulation est terminée" }),
    ).toBeVisible();

    const result = localSql(`
      select orders.status || ':' || orders.payment_status || ':' ||
        (select count(*) from public.payment_attempts as attempts where attempts.order_id = orders.id) || ':' ||
        (select string_agg(attempts.method::text || '=' || attempts.outcome::text, ',' order by attempts.created_at)
         from public.payment_attempts as attempts where attempts.order_id = orders.id)
      from public.orders
      where customer_name = ${sqlText(customer.name)}
        and customer_phone = ${sqlText(customer.phone)};
    `);
    expect(result).toBe("confirmed:succeeded:2:flooz=failed,tmoney=succeeded");
  } finally {
    cleanupTestData([customer]);
    const restoredStock = Number(
      localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
    );
    expect(restoredStock).toBe(initialStock);
  }
});

test("commandes locales concurrentes : une seule réserve la dernière unité", async () => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  const clientA = localClient();
  const clientB = localClient();
  const first = newTestCustomer();
  const second = newTestCustomer();
  const customers = [first, second];
  const initialStock = Number(
    localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
  );
  expect(initialStock).toBeGreaterThan(0);

  try {
    localSql(`update public.product_variants set stock = 1 where sku = ${sqlText(testSku)};`);

    const createOrder = (client: ReturnType<typeof localClient>, customer: TestCustomer) =>
      client.rpc("create_order", {
        p_idempotency_key: randomUUID(),
        p_items: [{ sku: testSku, qty: 1 }],
        p_customer: { name: customer.name, phone: customer.phone },
        p_delivery: {
          zone_code: "lome",
          city: "Lomé",
          district: "Test",
          landmark: "Test local",
        },
        p_method: "card",
        p_fictitious_ack: true,
      });

    const results = await Promise.all([createOrder(clientA, first), createOrder(clientB, second)]);
    expect(results.filter((result) => !result.error && result.data?.length === 1)).toHaveLength(1);
    expect(
      results.filter((result) => result.error?.message.startsWith("VS_OUT_OF_STOCK")),
    ).toHaveLength(1);
    expect(
      Number(
        localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
      ),
    ).toBe(0);
  } finally {
    cleanupTestData(customers);
    localSql(
      `update public.product_variants set stock = ${initialStock} where sku = ${sqlText(testSku)};`,
    );
    const restoredStock = Number(
      localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
    );
    expect(restoredStock).toBe(initialStock);
  }
});

test("cron local : les commandes échues sont annulées et leur stock restitué", async () => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  test.setTimeout(100_000);
  const client = localClient();
  const customer = newTestCustomer();
  const initialStock = Number(
    localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
  );
  expect(initialStock).toBeGreaterThan(0);

  try {
    const { data, error } = await client.rpc("create_order", {
      p_idempotency_key: randomUUID(),
      p_items: [{ sku: testSku, qty: 1 }],
      p_customer: { name: customer.name, phone: customer.phone },
      p_delivery: {
        zone_code: "lome",
        city: "Lomé",
        district: "Test",
        landmark: "Test local",
      },
      p_method: "card",
      p_fictitious_ack: true,
    });
    if (error || !data?.[0]) throw new Error("La commande locale de test n’a pas été créée.");

    localSql(`
      update public.orders
      set payment_deadline = pg_catalog.now() - interval '1 minute'
      where customer_name = ${sqlText(customer.name)}
        and customer_phone = ${sqlText(customer.phone)};
    `);

    await expect
      .poll(
        () =>
          localSql(`
            select status::text || ':' || payment_status::text
            from public.orders
            where customer_name = ${sqlText(customer.name)}
              and customer_phone = ${sqlText(customer.phone)};
          `),
        { timeout: 80_000, intervals: [1_000, 2_500, 5_000] },
      )
      .toBe("cancelled:expired");

    const releasedStock = Number(
      localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
    );
    expect(releasedStock).toBe(initialStock);
  } finally {
    cleanupTestData([customer]);
    const restoredStock = Number(
      localSql(`select stock from public.product_variants where sku = ${sqlText(testSku)};`),
    );
    expect(restoredStock).toBe(initialStock);
  }
});
