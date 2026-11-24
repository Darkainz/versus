import { describe, expect, it } from "vitest";
import { checkoutFormSchema, startPaymentFormSchema, trackOrderFormSchema } from "./checkout";

const validCheckout = {
  idempotency_key: "26f78d6a-4bd0-48b4-b086-05fc4fa13258",
  items: JSON.stringify([{ sku: "IP18-BOR-512", qty: 1 }]),
  customer_name: "Ama Mensah",
  customer_phone: "+228 90 12 34 56",
  customer_email: "",
  zone_code: "lome",
  city: "Lomé",
  district: "Tokoin",
  landmark: "Près du marché",
  instructions: "",
  payment_method: "tmoney",
  fictitious_ack: true,
};

describe("checkoutFormSchema", () => {
  it("normalise les coordonnées et décode les lignes du panier", () => {
    expect(checkoutFormSchema.parse(validCheckout)).toMatchObject({
      customer_phone: "+22890123456",
      customer_email: null,
      items: [{ sku: "IP18-BOR-512", qty: 1 }],
    });
  });

  it("refuse les numéros invalides, les paniers trop grands et l'absence de consentement fictif", () => {
    expect(checkoutFormSchema.safeParse({ ...validCheckout, customer_phone: "123" }).success).toBe(
      false,
    );
    expect(
      checkoutFormSchema.safeParse({
        ...validCheckout,
        items: JSON.stringify(Array.from({ length: 11 }, () => ({ sku: "IP18-BOR-512", qty: 1 }))),
      }).success,
    ).toBe(false);
    expect(checkoutFormSchema.safeParse({ ...validCheckout, fictitious_ack: false }).success).toBe(
      false,
    );
  });

  it("demande un téléphone mobile money sans demander de données de carte", () => {
    expect(
      startPaymentFormSchema.safeParse({
        number: "VS-2026-000101",
        method: "tmoney",
        msisdn: "90 12 34 56",
      }),
    ).toMatchObject({ success: true, data: { msisdn: "+22890123456" } });
    expect(
      startPaymentFormSchema.safeParse({
        number: "VS-2026-000101",
        method: "tmoney",
        msisdn: "",
      }).success,
    ).toBe(false);
    expect(
      startPaymentFormSchema.safeParse({
        number: "VS-2026-000101",
        method: "card",
        msisdn: "4111111111111111",
      }).success,
    ).toBe(false);
  });
});

describe("trackOrderFormSchema", () => {
  it("valide et normalise le numéro utilisé pour le suivi", () => {
    expect(
      trackOrderFormSchema.parse({
        number: "VS-2026-000101",
        phone: "90-12-34-56",
      }),
    ).toEqual({ number: "VS-2026-000101", phone: "+22890123456" });
    expect(
      trackOrderFormSchema.safeParse({ number: "VS-2026-00010", phone: "90-12-34-56" }).success,
    ).toBe(false);
  });
});
