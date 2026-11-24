import { describe, expect, it } from "vitest";
import type { DeliveryZoneOption } from "@/config/policies";
import { amountUntilFreeDelivery } from "./fees";

const lome: DeliveryZoneOption = {
  code: "lome",
  label: "Lomé et environs",
  fee_fcfa: 1500,
  free_from_fcfa: 300000,
  eta_label: "24 à 48 h",
};

describe("amountUntilFreeDelivery", () => {
  it("calcule le restant sous le seuil et s'arrête à zéro", () => {
    expect(amountUntilFreeDelivery(250000, lome)).toBe(50000);
    expect(amountUntilFreeDelivery(300000, lome)).toBe(0);
    expect(amountUntilFreeDelivery(350000, lome)).toBe(0);
  });

  it("n'annonce aucun seuil sans zone ou pour une zone sans gratuité", () => {
    expect(amountUntilFreeDelivery(0, undefined)).toBe(0);
    expect(amountUntilFreeDelivery(0, { ...lome, free_from_fcfa: null })).toBe(0);
  });
});
