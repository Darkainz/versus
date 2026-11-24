import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "/%2F%2Fevil.example",
    "/%09evil.example",
    "/%0Aevil.example",
    "/%0Devil.example",
    "javascript:alert(1)",
    "/compte\t",
  ])("rejette une cible dangereuse : %s", (value) => {
    expect(safeRedirect(value)).toBe("/compte");
  });

  it("conserve le chemin, la recherche et le fragment d'une cible locale", () => {
    expect(safeRedirect("/compte/commandes?tri=recent#liste")).toBe(
      "/compte/commandes?tri=recent#liste",
    );
  });

  it("n'autorise qu'une cible absolue de même origine", () => {
    expect(safeRedirect("http://localhost:3000/compte?source=mail")).toBe("/compte?source=mail");
  });

  it("utilise le fallback fourni lorsque la cible est invalide", () => {
    expect(safeRedirect("https://evil.example", "/connexion")).toBe("/connexion");
  });
});
