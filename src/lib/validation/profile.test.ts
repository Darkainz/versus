import { describe, expect, it } from "vitest";
import { profileSchema } from "./profile";

describe("profileSchema", () => {
  it("normalise le téléphone ou conserve une valeur vide comme null", () => {
    expect(profileSchema.parse({ full_name: "Ama Mensah", phone: "90 12 34 56" })).toEqual({
      full_name: "Ama Mensah",
      phone: "+22890123456",
    });
    expect(profileSchema.parse({ full_name: "Ama Mensah", phone: "" }).phone).toBeNull();
  });

  it("rejette un téléphone togolais invalide", () => {
    expect(profileSchema.safeParse({ full_name: "Ama Mensah", phone: "123" }).success).toBe(false);
  });
});
