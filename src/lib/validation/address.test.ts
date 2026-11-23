import { describe, expect, it } from "vitest";
import { addressSchema } from "./address";

const address = {
  label: " Domicile ",
  recipient_name: " Client Démo ",
  phone: "90 12 34 56",
  zone_code: "lome",
  city: " Lomé ",
  district: " Tokoin ",
  landmark: " Près du marché ",
  instructions: "",
  is_default: true,
};

describe("addressSchema", () => {
  it("normalise les coordonnées et les champs facultatifs", () => {
    expect(addressSchema.parse(address)).toMatchObject({
      label: "Domicile",
      recipient_name: "Client Démo",
      phone: "+22890123456",
      city: "Lomé",
      instructions: null,
    });
  });

  it("rejette un téléphone et une zone invalides", () => {
    expect(addressSchema.safeParse({ ...address, phone: "123" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, zone_code: "../invalid" }).success).toBe(false);
  });
});
