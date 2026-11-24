import { expect, test } from "@playwright/test";

/**
 * Étape 9 : en-têtes de sécurité, données structurées, plan du site, sonde de santé. Le site reste
 * non indexable (ADR 006) : le plan du site existe, mais `robots.txt` interdit tout.
 */

test.describe("en-têtes de sécurité", () => {
  for (const path of ["/", "/boutique", "/produit/iphone-18-pro", "/api/health"]) {
    test(`${path} porte les en-têtes de l'étape 9`, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["permissions-policy"]).toContain("geolocation=()");
      expect(headers["x-frame-options"]).toBe("DENY");
      const csp = headers["content-security-policy"] ?? "";
      for (const directive of [
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ]) {
        expect(csp, path).toContain(directive);
      }
      // Compromis documenté : pas de script-src strict (scripts inline de l'App Router).
      expect(csp).not.toContain("script-src");
    });
  }
});

async function jsonLdOf(page: import("@playwright/test").Page) {
  const texts = await page.locator('script[type="application/ld+json"]').allTextContents();
  return texts.map((text) => JSON.parse(text) as Record<string, unknown>);
}

test.describe("données structurées", () => {
  test("l'accueil publie une Organization, et jamais de Product ni d'Offer", async ({ page }) => {
    await page.goto("/");
    const data = await jsonLdOf(page);
    expect(data.map((item) => item["@type"])).toContain("Organization");
    const organization = data.find((item) => item["@type"] === "Organization")!;
    expect(organization.name).toBe("VERSUS");
    expect(JSON.stringify(data)).not.toMatch(/"@type":"(Product|Offer)"/);
  });

  test("une fiche produit publie un BreadcrumbList Accueil › marque › produit", async ({
    page,
  }) => {
    await page.goto("/produit/iphone-18-pro");
    const data = await jsonLdOf(page);
    const list = data.find((item) => item["@type"] === "BreadcrumbList") as {
      itemListElement: { position: number; name: string; item?: string }[];
    };
    expect(list.itemListElement.map((entry) => entry.name)).toEqual([
      "Accueil",
      "Apple",
      "iPhone 18 Pro",
    ]);
    expect(list.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(list.itemListElement[0]!.item).toMatch(/^https?:\/\/[^/]+\/$/);
    expect(list.itemListElement[1]!.item).toMatch(/\/marques\/apple$/);
    // La page courante n'a pas d'URL.
    expect(list.itemListElement[2]!.item).toBeUndefined();
    expect(JSON.stringify(data)).not.toMatch(/"@type":"(Product|Offer)"/);
  });
});

test.describe("plan du site et robots", () => {
  test("sitemap.xml liste les pages publiques et les 103 fiches, sans pages privées", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]!);
    const paths = locations.map((location) => new URL(location).pathname);
    expect(paths).toContain("/");
    expect(paths).toContain("/boutique");
    expect(paths).toContain("/marques/samsung");
    expect(paths).toContain("/produit/iphone-18-pro");
    expect(paths.filter((path) => path.startsWith("/produit/"))).toHaveLength(103);
    expect(new Set(paths).size).toBe(paths.length);
    for (const privatePath of ["/panier", "/commande", "/suivi", "/compte", "/recherche"]) {
      expect(
        paths.some((path) => path.startsWith(privatePath)),
        privatePath,
      ).toBe(false);
    }
  });

  test("robots.txt interdit tout tant que le site est fictif", async ({ request }) => {
    const text = await (await request.get("/robots.txt")).text();
    expect(text).toContain("Disallow: /");
  });
});

test.describe("sonde de santé et tâche planifiée", () => {
  test("/api/health répond 200 sans cache et sans détail", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(Object.keys(body).sort()).toEqual(["db", "status"]);
  });

  test("la tâche planifiée refuse un appel sans secret valide", async ({ request }) => {
    const anonymous = await request.get("/api/cron/keepalive");
    expect([401, 503]).toContain(anonymous.status());
    const wrong = await request.get("/api/cron/keepalive", {
      headers: { authorization: "Bearer mauvais-secret" },
    });
    expect([401, 503]).toContain(wrong.status());
  });
});
