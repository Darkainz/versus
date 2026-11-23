import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import type { Database } from "../src/lib/database.types";

const enabled = process.env.RUN_LOCAL_ADMIN_E2E === "1";

function localAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error("La configuration Supabase locale est absente.");
  const endpoint = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    throw new Error("Les tests admin locaux refusent tout endpoint Supabase distant.");
  }
  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function localPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("La configuration Supabase locale est absente.");
  const endpoint = new URL(url);
  if (!["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    throw new Error("Les tests admin locaux refusent tout endpoint Supabase distant.");
  }
  return createClient<Database>(url, publishableKey, {
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

function cleanupTestOrder(number: string, phone: string) {
  localSql(`
    do $cleanup$
    declare
      v_order public.orders%rowtype;
      v_item record;
    begin
      select * into v_order
      from public.orders
      where number = ${sqlText(number)};

      if found then
        if v_order.status = 'delivered' then
          for v_item in
            select order_items.variant_id, order_items.quantity
            from public.order_items as order_items
            where order_items.order_id = v_order.id
          loop
            update public.product_variants
            set stock = stock + v_item.quantity
            where id = v_item.variant_id;
          end loop;
        elsif v_order.status <> 'cancelled' then
          perform private.release_order_stock(v_order.id, 'order_cancelled');
        end if;

        delete from public.stock_movements where order_id = v_order.id;
        delete from public.orders where id = v_order.id;
      end if;

      delete from private.order_attempts where phone = ${sqlText(phone)};
    end
    $cleanup$;
  `);
}

async function expectTrackingHistory(
  page: Page,
  number: string,
  phone: string,
  statuses: string[],
) {
  await page.goto("/suivi");
  await page.getByLabel("Numéro de commande").fill(number);
  await page.getByLabel("Téléphone utilisé à la commande").fill(phone);
  await page.getByRole("button", { name: "Rechercher la commande" }).click();

  const result = page.getByRole("region", { name: number });
  await expect(result).toBeVisible();
  const history = result.locator("ol");
  for (const status of statuses) {
    await expect(history.getByText(status, { exact: true })).toBeVisible();
  }
}

test("Admin local : garde client, tableau de bord et ajustement du stock", async ({ page }) => {
  test.skip(!enabled, "Réservé aux tests autorisés sur Supabase local.");
  test.setTimeout(90_000);

  const adminClient = localAdminClient();
  const publicClient = localPublicClient();
  const nonAdminClient = localPublicClient();
  const email = `versus-admin-${randomUUID()}@example.test`;
  const password = `Admin-${randomUUID()}!`;
  let userId: string | undefined;
  let adjusted = false;
  let productId: string | undefined;
  let originalMaxQty: number | undefined;
  let originalHomeSlot:
    | {
        id: string;
        product_id: string;
        slot: string;
        position: number;
        theme_key: string;
        headline: string | null;
        subline: string | null;
        is_active: boolean;
      }
    | undefined;
  const transitionOrders: { number: string; phone: string }[] = [];

  const createCashOrder = async () => {
    const digits = randomUUID().replaceAll("-", "").replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
    const phone = `+228${digits}`;
    const { data, error } = await publicClient.rpc("create_order", {
      p_idempotency_key: randomUUID(),
      p_items: [{ sku: "AP5-BLA", qty: 1 }],
      p_customer: {
        name: `VERSUS Admin COD ${randomUUID()}`,
        phone,
        email: null,
      },
      p_delivery: {
        zone_code: "lome",
        city: "Lomé",
        district: "Tokoin",
        landmark: "E2E admin",
      },
      p_method: "cash_on_delivery",
      p_fictitious_ack: true,
    });
    if (error || !data?.[0]) {
      throw error ?? new Error("La commande COD de test n’a pas été créée.");
    }

    const orderNumber = data[0].order_number;
    transitionOrders.push({ number: orderNumber, phone });
    return { number: orderNumber, phone };
  };

  try {
    await page.goto("/inscription");
    await page.getByLabel("Nom complet").fill("Admin local VERSUS");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.getByLabel("Mot de passe").fill(password);
    await page.getByRole("checkbox", { name: /J’accepte la politique de confidentialité/ }).check();
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    await expect(page).toHaveURL(/\/compte\/?$/);

    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });
    if (usersError) throw usersError;
    const user = users.users.find((candidate) => candidate.email === email);
    if (!user) throw new Error("Le compte admin d’essai n’a pas été créé.");
    userId = user.id;

    const { error: signInError } = await nonAdminClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw signInError;
    const { data: visibleProduct, error: visibleProductError } = await nonAdminClient
      .from("products")
      .select("id, tagline")
      .eq("is_active", true)
      .limit(1)
      .single();
    if (visibleProductError) throw visibleProductError;
    const { data: updatedProducts, error: updateError } = await nonAdminClient
      .from("products")
      .update({ tagline: "Modification client interdite" })
      .eq("id", visibleProduct.id)
      .select("id");
    expect(updateError).toBeNull();
    expect(updatedProducts).toEqual([]);
    expect(
      localSql(`select tagline from public.products where id = '${visibleProduct.id}'::uuid;`),
    ).toBe(visibleProduct.tagline);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

    localSql(`
      insert into public.user_roles (user_id, role)
      values ('${userId}'::uuid, 'admin')
      on conflict (user_id) do update set role = excluded.role;
    `);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

    await page.goto("/admin/stock");
    await expect(page.getByRole("heading", { name: "Gestion du stock" })).toBeVisible();
    const initialStock = Number(
      localSql(`select stock::text from public.product_variants where sku = 'AP5-BLA';`),
    );
    const form = page.getByRole("listitem").filter({ hasText: "AP5-BLA" });
    await form.getByLabel("Variation").fill("1");
    await form.getByLabel("Motif").selectOption("restock");
    await form.getByLabel("Note").fill("Test E2E local");
    await form.getByRole("button", { name: "Ajuster" }).click();
    await expect(form.getByRole("status")).toContainText("Stock ajusté.");
    await expect
      .poll(() =>
        Number(localSql(`select stock::text from public.product_variants where sku = 'AP5-BLA';`)),
      )
      .toBe(initialStock + 1);
    adjusted = true;

    await page.goto("/admin/commandes");
    await expect(page.getByRole("heading", { name: "Commandes" })).toBeVisible();

    const cashOrder = await createCashOrder();
    const cashOrderNumber = cashOrder.number;
    await page.goto(`/admin/commandes/${cashOrderNumber}`);
    await expect(page.getByRole("heading", { name: `Commande ${cashOrderNumber}` })).toBeVisible();
    await expect(
      page.getByLabel("Nouveau statut").locator('option[value="delivered"]'),
    ).toHaveCount(0);
    expect(
      localSql(
        `select status::text || ':' || payment_status::text from public.orders where number = ${sqlText(cashOrderNumber)};`,
      ),
    ).toBe("confirmed:cash_due");

    await page.getByLabel("Nouveau statut").selectOption("preparing");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("status")).toContainText("Statut de commande mis à jour.");
    expect(
      localSql(
        `select status::text from public.orders where number = ${sqlText(cashOrderNumber)};`,
      ),
    ).toBe("preparing");

    await page.getByLabel("Nouveau statut").selectOption("shipped");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("status")).toContainText("Statut de commande mis à jour.");
    expect(
      localSql(
        `select status::text from public.orders where number = ${sqlText(cashOrderNumber)};`,
      ),
    ).toBe("shipped");

    await page.getByLabel("Nouveau statut").selectOption("delivered");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText(
      "Le montant à la livraison doit être confirmé",
    );
    expect(
      localSql(
        `select status::text || ':' || payment_status::text from public.orders where number = ${sqlText(cashOrderNumber)};`,
      ),
    ).toBe("shipped:cash_due");

    await page.getByLabel("Nouveau statut").selectOption("delivered");
    await page.getByLabel("Montant encaissé à la livraison").check();
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("status")).toContainText("Statut de commande mis à jour.");
    expect(
      localSql(
        `select status::text || ':' || payment_status::text || ':' || (cash_collected_at is not null)::text from public.orders where number = ${sqlText(cashOrderNumber)};`,
      ),
    ).toBe("delivered:cash_collected:true");
    expect(
      localSql(
        `select count(*)::text from public.order_status_history where order_id = (select id from public.orders where number = ${sqlText(cashOrderNumber)}) and actor = 'admin';`,
      ),
    ).toBe("3");
    await expectTrackingHistory(page, cashOrder.number, cashOrder.phone, [
      "Confirmée",
      "En préparation",
      "Expédiée",
      "Livrée",
    ]);

    const stockBeforeCancellation = Number(
      localSql("select stock::text from public.product_variants where sku = 'AP5-BLA';"),
    );
    const cancelledOrder = await createCashOrder();
    const cancelledOrderNumber = cancelledOrder.number;
    await page.goto(`/admin/commandes/${cancelledOrderNumber}`);
    await page.getByLabel("Nouveau statut").selectOption("cancelled");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByRole("status")).toContainText("Statut de commande mis à jour.");
    expect(
      localSql(
        `select status::text from public.orders where number = ${sqlText(cancelledOrderNumber)};`,
      ),
    ).toBe("cancelled");
    expect(
      Number(localSql("select stock::text from public.product_variants where sku = 'AP5-BLA';")),
    ).toBe(stockBeforeCancellation);
    expect(
      localSql(
        `select count(*)::text from public.stock_movements where order_id = (select id from public.orders where number = ${sqlText(cancelledOrderNumber)}) and reason = 'order_cancelled';`,
      ),
    ).toBe("1");
    await expectTrackingHistory(page, cancelledOrder.number, cancelledOrder.phone, [
      "Confirmée",
      "Annulée",
    ]);

    await page.goto("/admin/livraison");
    await expect(page.getByRole("heading", { name: "Livraison et paramètres" })).toBeVisible();
    originalMaxQty = Number(
      localSql("select max_qty_per_line::text from public.shop_settings where id = true;"),
    );
    const updatedMaxQty = originalMaxQty === 5 ? 4 : originalMaxQty + 1;
    await page.getByLabel("Quantité maximale par ligne").fill(String(updatedMaxQty));
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("status")).toContainText("Paramètres enregistrés.");
    expect(
      Number(localSql("select max_qty_per_line::text from public.shop_settings where id = true;")),
    ).toBe(updatedMaxQty);

    await page.goto("/admin/accueil");
    await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
    originalHomeSlot = JSON.parse(
      localSql(`
        select pg_catalog.row_to_json(home_slot)::text
        from (
          select id::text, product_id::text, slot, position, theme_key,
            headline, subline, is_active
          from public.home_slots
          order by slot, position
          limit 1
        ) as home_slot;
      `),
    ) as typeof originalHomeSlot;
    if (!originalHomeSlot) throw new Error("Aucun emplacement d’accueil n’est configuré.");
    const updatedHeadline = `Titre E2E ${randomUUID()}`;
    const homeForm = page.locator("form").first();
    await homeForm.getByLabel("Titre", { exact: true }).fill(updatedHeadline);
    await homeForm.getByRole("button", { name: "Enregistrer l’emplacement" }).click();
    await expect(homeForm.getByRole("status")).toContainText("Emplacement enregistré.");
    expect(
      localSql(`select headline from public.home_slots where id = '${originalHomeSlot.id}'::uuid;`),
    ).toBe(updatedHeadline);

    await page.goto("/admin/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

    await page.goto("/admin/produits/nouveau");
    await page.getByLabel("Code").fill("ae2e");
    await page.getByLabel("Slug").fill("admin-e2e-produit");
    await page.getByLabel("Marque").selectOption("apple");
    await page.getByLabel("Catégorie").selectOption("smartphones");
    await page.getByLabel("Nom").fill("Produit E2E admin");
    await page.getByLabel("Accroche").fill("Produit fictif créé pour valider l’administration.");
    await page.getByLabel("Description").fill("Description de test, sans mise en vente.");
    await page.getByLabel("Visuel").selectOption("phone");
    await page.getByLabel("Garantie (mois)").fill("12");
    await page.getByLabel("Date de sortie").fill("2026-11-23");
    await page.getByRole("button", { name: "Créer le produit" }).click();
    await expect(page.getByRole("status")).toContainText("Produit créé.");

    productId = localSql(`
      select id::text from public.products where code = 'ae2e';
    `);
    await page.goto(`/admin/produits/${productId}/apercu`);
    await expect(page.getByRole("heading", { name: "Produit E2E admin" })).toBeVisible();
    await expect(page.getByText(/Aperçu administrateur/)).toBeVisible();

    await page.goto(`/admin/produits/${productId}`);
    const newVariantForm = page.locator('form[aria-label="Nouvelle variante"]');
    await newVariantForm.getByLabel("SKU").fill("AE2E-BLA");
    await newVariantForm.getByLabel("Couleur", { exact: true }).fill("Bleu test");
    await newVariantForm.getByLabel("Slug couleur").fill("bleu-test");
    await newVariantForm.getByLabel("Hex couleur").fill("#112233");
    await newVariantForm.getByLabel("Stockage (Go)").fill("256");
    await newVariantForm.getByLabel("Prix indicatif (FCFA)").fill("125000");
    await newVariantForm.getByLabel("Seuil stock bas").fill("2");
    await newVariantForm.getByLabel("Variante par défaut").check();
    await newVariantForm.getByRole("button", { name: "Ajouter la variante" }).click();
    await expect(newVariantForm.getByRole("status")).toContainText("Variante créée avec stock 0.");
    expect(
      localSql(
        `select count(*)::text from public.product_variants where sku = 'AE2E-BLA' and stock = 0;`,
      ),
    ).toBe("1");

    await page.reload();
    const variantDetails = page.locator("details").filter({ hasText: "AE2E-BLA" });
    await variantDetails.locator("summary").click();
    const variantEditForm = page.locator('form[aria-label="Modifier variante AE2E-BLA"]');
    await variantEditForm.getByLabel("Couleur", { exact: true }).fill("Bleu modifie");
    await variantEditForm.getByLabel("Slug couleur").fill("bleu-modifie");
    await variantEditForm.getByLabel("Hex couleur").fill("#223344");
    await variantEditForm.getByLabel("Prix indicatif (FCFA)").fill("145000");
    await variantEditForm.getByLabel("Seuil stock bas").fill("4");
    await expect(variantEditForm.locator('[name="stock"]')).toHaveCount(0);
    await variantEditForm.getByRole("button", { name: "Enregistrer la variante" }).click();
    await expect(variantEditForm.getByRole("status")).toContainText("Variante mise à jour.");
    expect(
      localSql(`
        select color_name || ':' || color_slug || ':' || color_hex || ':' ||
          price_fcfa::text || ':' || low_stock_threshold::text || ':' ||
          stock::text || ':' || is_default::text
        from public.product_variants
        where sku = 'AE2E-BLA';
      `),
    ).toBe("Bleu modifie:bleu-modifie:#223344:145000:4:0:true");

    const specsForm = page.locator('form[aria-label="Spécifications du produit"]');
    await specsForm.getByLabel("Écran (diagonale, pouces)").fill("6.7");
    await specsForm.getByLabel("Écran (technologie)").fill("OLED");
    await specsForm.getByLabel("Fréquence d’affichage (Hz)").fill("120");
    await specsForm.getByLabel("Puce").fill("A19");
    await specsForm.getByLabel("Batterie (mAh)").fill("4000");
    await specsForm.getByLabel("Autonomie indicative (heures)").fill("20");
    await specsForm.getByLabel("Charge rapide (W)").fill("35");
    await specsForm.getByLabel("Appareil photo principal (Mpx)").fill("48");
    await specsForm.getByLabel("Poids (g)").fill("190.5");
    await specsForm.getByLabel("Étanchéité").fill("IP68");
    await specsForm.getByLabel("5G").selectOption("true");
    await specsForm.getByLabel("Note des spécifications").fill("Caractéristiques E2E indicatives.");
    await specsForm.getByRole("button", { name: "Enregistrer les spécifications" }).click();
    await expect(specsForm.getByRole("status")).toContainText("Spécifications enregistrées.");
    expect(
      localSql(`
        select concat_ws(
          ':',
          screen_size_in::text,
          screen_tech,
          refresh_hz::text,
          chip,
          battery_mah::text,
          autonomy_hours::text,
          charging_w::text,
          main_camera_mp::text,
          weight_g::text,
          ip_rating,
          has_5g::text,
          coalesce(has_anc::text, 'null'),
          specs_note
        )
        from public.product_specs
        where product_id = '${productId}'::uuid;
      `),
    ).toBe(
      "6.70:OLED:120:A19:4000:20:35:48:190.5:IP68:true:null:Caractéristiques E2E indicatives.",
    );
    await specsForm.getByLabel("Écran (technologie)").fill("OLED mis a jour");
    await specsForm.getByRole("button", { name: "Enregistrer les spécifications" }).click();
    await expect(specsForm.getByRole("status")).toContainText("Spécifications enregistrées.");
    expect(
      localSql(`
        select screen_tech || ':' || battery_mah::text
        from public.product_specs
        where product_id = '${productId}'::uuid;
      `),
    ).toBe("OLED mis a jour:4000");

    const pixelImage = {
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    };
    await page.getByLabel("Fichier JPEG, PNG ou WebP").setInputFiles(pixelImage);
    await page.getByLabel("Texte alternatif").fill("Pixel fictif de test");
    await page.getByRole("button", { name: "Téléverser" }).click();
    await expect(page.getByText("Image téléversée.", { exact: true })).toBeVisible();
    const firstImageId = localSql(`
      select id::text from public.product_images
      where product_id = '${productId}'::uuid and alt = 'Pixel fictif de test';
    `);
    const firstImagePath = localSql(`
      select storage_path from public.product_images where id = '${firstImageId}'::uuid;
    `);
    await page.reload();
    const firstImageCard = page.getByRole("listitem", { name: "Image Pixel fictif de test" });
    await firstImageCard.getByRole("button", { name: "Choisir comme image principale" }).click();
    await expect(page.getByText("Image principale mise à jour.", { exact: true })).toBeVisible();
    expect(
      localSql(
        `select is_primary::text from public.product_images where id = '${firstImageId}'::uuid;`,
      ),
    ).toBe("true");

    await page.goto("/produit/admin-e2e-produit");
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await page.goto(`/admin/produits/${productId}`);
    const productForm = page.locator("form").first();
    await productForm.getByLabel("Produit actif").check();
    await productForm.getByRole("button", { name: "Enregistrer" }).click();
    await expect(productForm.getByRole("status")).toContainText("Produit mis à jour.");
    expect(
      localSql(`select is_active::text from public.products where id = '${productId}'::uuid;`),
    ).toBe("true");

    await page
      .getByRole("listitem", { name: "Image Pixel fictif de test" })
      .getByRole("button", { name: "Supprimer" })
      .click();
    await expect(
      page.getByText("Choisissez une autre image principale avant de supprimer celle-ci.", {
        exact: true,
      }),
    ).toBeVisible();
    expect(
      localSql(
        `select count(*)::text from public.product_images where id = '${firstImageId}'::uuid;`,
      ),
    ).toBe("1");
    expect(
      localSql(`
        select count(*)::text from storage.objects
        where bucket_id = 'product-images' and name = ${sqlText(firstImagePath)};
      `),
    ).toBe("1");

    await page.reload();
    await page.getByLabel("Fichier JPEG, PNG ou WebP").setInputFiles(pixelImage);
    await page.getByLabel("Texte alternatif").fill("Deuxième pixel fictif");
    await page.getByRole("button", { name: "Téléverser" }).click();
    await expect(page.getByText("Image téléversée.", { exact: true })).toBeVisible();
    const secondImageId = localSql(`
      select id::text from public.product_images
      where product_id = '${productId}'::uuid and alt = 'Deuxième pixel fictif';
    `);
    await page.reload();
    const secondImageCard = page.getByRole("listitem", { name: "Image Deuxième pixel fictif" });
    await secondImageCard.getByRole("button", { name: "Choisir comme image principale" }).click();
    await expect(page.getByText("Image principale mise à jour.", { exact: true })).toBeVisible();
    expect(
      localSql(`
        select (select is_primary::text from public.product_images where id = '${firstImageId}'::uuid)
          || ':' ||
          (select is_primary::text from public.product_images where id = '${secondImageId}'::uuid);
      `),
    ).toBe("false:true");

    await page
      .getByRole("listitem", { name: "Image Pixel fictif de test" })
      .getByRole("button", { name: "Supprimer" })
      .click();
    await expect(page.getByText("Image supprimée.", { exact: true })).toBeVisible();
    expect(
      localSql(
        `select count(*)::text from public.product_images where id = '${firstImageId}'::uuid;`,
      ),
    ).toBe("0");
    expect(
      localSql(`
        select count(*)::text from storage.objects
        where bucket_id = 'product-images' and name = ${sqlText(firstImagePath)};
      `),
    ).toBe("0");

    await page.goto("/produit/admin-e2e-produit");
    await expect(page.getByRole("heading", { name: "Produit E2E admin" })).toBeVisible();
    await expect(page.getByText(/Cette version est épuisée/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Épuisé/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await page.goto("/boutique");
    await expect(page.locator('[data-product-card="ae2e"]')).toBeVisible();
  } finally {
    for (const order of transitionOrders) {
      cleanupTestOrder(order.number, order.phone);
    }
    if (originalHomeSlot) {
      localSql(`
        update public.home_slots
        set product_id = '${originalHomeSlot.product_id}'::uuid,
          slot = '${originalHomeSlot.slot}'::public.home_slot_kind,
          position = ${originalHomeSlot.position},
          theme_key = ${sqlText(originalHomeSlot.theme_key)},
          headline = ${originalHomeSlot.headline === null ? "null" : sqlText(originalHomeSlot.headline)},
          subline = ${originalHomeSlot.subline === null ? "null" : sqlText(originalHomeSlot.subline)},
          is_active = ${originalHomeSlot.is_active}
        where id = '${originalHomeSlot.id}'::uuid;
      `);
    }
    if (originalMaxQty !== undefined) {
      localSql(`
        update public.shop_settings
        set max_qty_per_line = ${originalMaxQty}
        where id = true;
      `);
    }
    if (productId) {
      const { data: objects } = await adminClient.storage
        .from("product-images")
        .list(`products/${productId}`);
      if (objects?.length) {
        await adminClient.storage
          .from("product-images")
          .remove(objects.map((object) => `products/${productId}/${object.name}`));
      }
    }
    localSql(`
      delete from public.products where code = 'ae2e';
    `);
    if (userId) {
      if (adjusted) {
        localSql(`
          update public.product_variants
          set stock = stock - 1
          where sku = 'AP5-BLA';
          delete from public.stock_movements
          where actor_id = '${userId}'::uuid
            and note = 'Test E2E local';
        `);
      }
      localSql(`delete from public.user_roles where user_id = '${userId}'::uuid;`);
      await adminClient.auth.admin.deleteUser(userId);
    }
  }
});
