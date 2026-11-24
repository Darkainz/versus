import { describe, expect, it } from "vitest";
import { breadcrumbJsonLd, jsonLdString, organizationJsonLd } from "./json-ld";

const base = "https://versus.example";

describe("jsonLdString", () => {
  it("échappe « < » pour qu'aucune donnée ne puisse fermer la balise <script>", () => {
    const text = jsonLdString({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
  });

  it("échappe les séparateurs de ligne U+2028 et U+2029", () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const text = jsonLdString({ name: `a${ls}b${ps}c` });
    expect(text).not.toContain(ls);
    expect(text).not.toContain(ps);
    expect(JSON.parse(text).name).toBe(`a${ls}b${ps}c`);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numérote les étapes, met une URL absolue aux liens et aucune à la page courante", () => {
    const data = breadcrumbJsonLd(
      [
        { label: "Accueil", href: "/" },
        { label: "Apple", href: "/marques/apple" },
        { label: "iPhone 18 Pro" },
      ],
      base,
    );
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://versus.example/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Apple",
        item: "https://versus.example/marques/apple",
      },
      { "@type": "ListItem", position: 3, name: "iPhone 18 Pro" },
    ]);
  });
});

describe("organizationJsonLd", () => {
  it("décrit l'organisation sans coordonnées, et n'est jamais un Product ni une Offer", () => {
    const data = organizationJsonLd(base);
    expect(data["@type"]).toBe("Organization");
    expect(data.url).toBe("https://versus.example/");
    expect(Object.keys(data).sort()).toEqual(
      ["@context", "@type", "description", "logo", "name", "url"].sort(),
    );
    expect(JSON.stringify(data)).not.toMatch(/Product|Offer|price/);
  });
});
