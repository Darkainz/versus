import { expect, test, type Page } from "@playwright/test";

/**
 * En-tête de bureau : la navigation et les icônes tiennent sur une ligne, sans retour à la ligne
 * dans un lien ni débordement horizontal (régression constatée en production à 1280 et 1440 px :
 * « Aide au choix » écrasé sur trois lignes). Sous 1240 px, c'est le menu mobile qui prend le relais.
 */

async function headerState(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector("header")!;
    const wrap = header.querySelector(".wrap")!;
    const links = [...header.querySelectorAll("a")].filter(
      (link) => link.textContent?.trim() && link.getBoundingClientRect().width > 0,
    );
    return {
      headerHeight: Math.round(header.getBoundingClientRect().height),
      tallest: Math.max(0, ...links.map((link) => Math.round(link.getBoundingClientRect().height))),
      overflow: wrap.scrollWidth - wrap.clientWidth,
      pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
      children: [...wrap.children].reduce((sum, el) => sum + el.getBoundingClientRect().width, 0),
      wrapWidth: wrap.clientWidth,
    };
  });
}

test.describe("en-tête de bureau", () => {
  for (const width of [1240, 1280, 1366, 1440, 1920]) {
    test(`à ${width} px : une seule ligne, sans débordement, navigation visible`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
      const state = await headerState(page);
      expect(state.headerHeight, JSON.stringify(state)).toBeLessThanOrEqual(58);
      expect(state.tallest, JSON.stringify(state)).toBeLessThanOrEqual(36);
      expect(state.overflow, JSON.stringify(state)).toBeLessThanOrEqual(0);
      expect(state.pageOverflow, JSON.stringify(state)).toBeLessThanOrEqual(0);
      // Marge de sécurité : les polices plus larges d'un autre système ne doivent rien casser.
      expect(state.children, JSON.stringify(state)).toBeLessThanOrEqual(state.wrapWidth - 60);
    });
  }

  test("« Tout le catalogue » apparaît dès que la place le permet (1290 px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(
      page.locator("header").getByRole("link", { name: "Tout le catalogue" }),
    ).toBeHidden();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(
      page.locator("header").getByRole("link", { name: "Tout le catalogue" }),
    ).toBeVisible();
  });

  for (const width of [768, 1024, 1239]) {
    test(`à ${width} px : le menu mobile remplace la navigation`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Navigation principale" })).toBeHidden();
      const state = await headerState(page);
      expect(state.pageOverflow, JSON.stringify(state)).toBeLessThanOrEqual(0);
      expect(state.headerHeight).toBeLessThanOrEqual(58);
    });
  }
});
