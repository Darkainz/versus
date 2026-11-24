import { site } from "@/config/site";

/**
 * Données structurées (étape 9, ADR 006). Seuls `Organization` et `BreadcrumbList` sont publiés :
 * jamais `Product` ni `Offer`, car la boutique est fictive et ses prix sont indicatifs.
 */

/**
 * Sérialise un objet JSON-LD pour une balise `<script>`. Les caractères `<`, U+2028 et U+2029 sont
 * échappés : un nom de produit contenant « </script> » ne peut pas fermer la balise.
 */
export function jsonLdString(data: object): string {
  return JSON.stringify(data)
    .replaceAll("<", String.raw`\u003c`)
    .replaceAll(String.fromCharCode(0x2028), String.raw`\u2028`)
    .replaceAll(String.fromCharCode(0x2029), String.raw`\u2029`);
}

type Crumb = { label: string; href?: string | null };

/** URL absolue d'un chemin du site (`base` sans barre oblique finale). */
function absolute(base: string, path: string): string {
  return path === "/" ? `${base}/` : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** `BreadcrumbList` : seules les étapes avec lien portent une URL ; la dernière est la page. */
export function breadcrumbJsonLd(items: readonly Crumb[], base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absolute(base, item.href) } : {}),
    })),
  };
}

/** `Organization` de la page d'accueil : identité du site, sans coordonnées ni réseaux. */
export function organizationJsonLd(base: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: absolute(base, "/"),
    description: site.description,
    logo: absolute(base, "/icon.svg"),
  };
}
