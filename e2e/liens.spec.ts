import { expect, test, type Page } from "@playwright/test";

/**
 * Principe 3 du plan : un lien n'apparaît que si sa page existe.
 * Depuis `/` et `/styleguide` (non lié depuis le site, visible sous next start), on parcourt
 * les pages internes et on vérifie :
 * - chaque <a href> et chaque <form action> interne répond 200 (GET) ;
 * - chaque ancre `#id` (seule ou `chemin#id`) existe sur la page cible ;
 * - aucun lien ne mène « nulle part » : href="" (ou action=""), href="#", "/#", "/credits#"…
 */

const MAX_PAGES = 200;

type Anchor = { from: string; target: string; id: string };

async function collectTargets(page: Page) {
  return page.evaluate(() => ({
    hrefs: Array.from(document.querySelectorAll("a[href]"), (a) => a.getAttribute("href") ?? ""),
    // Un formulaire lié à une Server Action (champs cachés `$ACTION_*` de Next) rend `action=""` :
    // React intercepte l'envoi, il n'y a pas d'adresse à explorer. Les autres formulaires sont
    // vérifiés comme avant.
    actions: Array.from(
      document.querySelectorAll("form[action]:not(:has(input[name^='$ACTION']))"),
      (f) => f.getAttribute("action") ?? "",
    ),
  }));
}

/**
 * Une page protégée (compte, commande) peut rediriger vers `/connexion` après le début de la
 * réponse : Next renvoie alors 200 et navigue côté client, ce qui détruit le contexte pendant la
 * lecture. On relit la page d'arrivée une fois la navigation terminée.
 */
async function collectTargetsStable(page: Page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await collectTargets(page);
    } catch (error) {
      const destroyed = error instanceof Error && error.message.includes("context was destroyed");
      if (!destroyed || attempt >= 2) throw error;
      await page.waitForLoadState("load");
    }
  }
}

/**
 * `page.goto` interrompu (`net::ERR_ABORTED`) : une navigation de la page précédente (préchargement
 * ou transition de Next) est encore en cours quand la suivante démarre. Ce n'est pas une erreur du
 * site : on rejoue la navigation une fois.
 */
async function gotoStable(page: Page, url: string, options?: Parameters<Page["goto"]>[1]) {
  try {
    return await page.goto(url, options);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) throw error;
    await page.waitForLoadState("load");
    return page.goto(url, options);
  }
}

/** Une ressource dont le dernier segment a une extension (image, PDF…) n'est pas explorée. */
function isPage(pathname: string) {
  return !/\.[a-z0-9]+$/i.test(pathname.split("/").at(-1) ?? "");
}

test("liens internes, actions de formulaires et ancres", async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);
  const origin = new URL(baseURL ?? "http://localhost:3000").origin;
  const queue = ["/", "/styleguide"];
  const visited = new Set<string>();
  const statusCache = new Map<string, number>();
  const anchors: Anchor[] = [];
  const errors: string[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const response = await gotoStable(page, current);
    if (response?.status() !== 200) {
      errors.push(`${current} répond ${response?.status() ?? "sans réponse"}`);
      continue;
    }

    const { hrefs, actions } = await collectTargetsStable(page);
    for (const raw of [...hrefs, ...actions]) {
      // Tests sur la chaîne brute : new URL("/#") donne hash === "", un fragment vide
      // passerait donc pour un lien valide vers la page.
      const trimmed = raw.trim();
      if (trimmed === "") {
        errors.push(`lien ou action vide sur ${current}`);
        continue;
      }
      if (trimmed.endsWith("#")) {
        errors.push(`ancre vide (href="${raw}") sur ${current}`);
        continue;
      }
      const url = new URL(raw, origin + current);
      if (url.origin !== origin) continue; // lien externe, mailto:, tel:

      const target = url.pathname + url.search;
      if (url.hash) {
        anchors.push({ from: current, target, id: decodeURIComponent(url.hash.slice(1)) });
      }
      if (!statusCache.has(target)) {
        const res = await request.get(target);
        statusCache.set(target, res.status());
      }
      const status = statusCache.get(target);
      if (status !== 200) {
        errors.push(`${current} → ${raw} répond ${status}`);
      } else if (isPage(url.pathname) && !visited.has(target)) {
        queue.push(target);
      }
    }
  }

  const anchorsByTarget = new Map<string, Anchor[]>();
  for (const anchor of anchors) {
    const targetAnchors = anchorsByTarget.get(anchor.target) ?? [];
    targetAnchors.push(anchor);
    anchorsByTarget.set(anchor.target, targetAnchors);
  }
  for (const [targetPath, targetAnchors] of anchorsByTarget) {
    await gotoStable(page, targetPath, { waitUntil: "domcontentloaded" });
    for (const anchor of targetAnchors) {
      const target = page.locator(`[id="${anchor.id.replace(/"/g, '\\"')}"]`);
      try {
        await target.waitFor({ state: "attached", timeout: 3_000 });
      } catch (error) {
        if (!(error instanceof Error) || error.name !== "TimeoutError") throw error;
        errors.push(`${anchor.from} → ${anchor.target}#${anchor.id} : id introuvable`);
      }
    }
  }

  // Accueil, styleguide, les 6 pages d'information (mentions, crédits, confidentialité, CGV,
  // livraison, garantie) et les 3 pages marque (lot 3 de la refonte).
  expect(visited.size, "accueil, styleguide et pages d'information").toBeGreaterThanOrEqual(8);
  for (const path of [
    "/confidentialite",
    "/cgv",
    "/livraison",
    "/garantie",
    "/marques/apple",
    "/marques/samsung",
    "/marques/xiaomi",
  ]) {
    expect(visited.has(path), `${path} est atteinte par un lien`).toBe(true);
  }
  expect(errors).toEqual([]);
});
