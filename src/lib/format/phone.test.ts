import { describe, expect, it } from "vitest";
import { normalizeTogoPhone } from "./phone";

describe("normalizeTogoPhone", () => {
  it("normalise les espaces usuels et conserve le code pays", () => {
    expect(normalizeTogoPhone("+228 90 12 34 56")).toBe("+22890123456");
    expect(normalizeTogoPhone("90-12-34-56")).toBe("+22890123456");
  });

  it("refuse les numéros qui ne contiennent pas exactement huit chiffres", () => {
    expect(normalizeTogoPhone("+2289012345")).toBeNull();
    expect(normalizeTogoPhone("+22990123456")).toBeNull();
    expect(normalizeTogoPhone("texte")).toBeNull();
  });
});
