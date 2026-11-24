import type { MetadataRoute } from "next";
import { brandHref, productHref, routeFor, type RouteKey } from "@/config/site";
import { getBrands, getCatalog, getCategories } from "@/lib/catalog/queries";
import { siteUrl } from "@/lib/env";

/** Pages publiques statiques, dans l'ordre du plan (§3.2). Les pages privées en sont exclues. */
const staticRoutes: readonly RouteKey[] = [
  "accueil",
  "boutique",
  "comparer",
  "aideAuChoix",
  "livraison",
  "garantie",
  "cgv",
  "mentionsLegales",
  "confidentialite",
  "credits",
];

/**
 * Plan du site (étape 9). Il existe pour le jour où `ALLOW_INDEXING` passera à « true » ; tant que
 * le site est fictif, `robots.ts` interdit tout et ne le cite pas (ADR 006). Ne contient ni panier,
 * ni commande, ni suivi, ni compte, ni recherche : ces pages ne sont jamais publiques.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, brands, categories] = await Promise.all([
    getCatalog(),
    getBrands(),
    getCategories(),
  ]);
  const paths = [
    ...staticRoutes.flatMap((key) => routeFor(key) ?? []),
    ...brands.flatMap(({ slug }) => brandHref(slug) ?? []),
    ...categories.map(({ slug }) => `/boutique/${slug}`),
    ...catalog.map(({ slug }) => productHref(slug)),
  ];
  return [...new Set(paths)].map((path) => ({
    url: path === "/" ? `${siteUrl}/` : `${siteUrl}${path}`,
  }));
}
