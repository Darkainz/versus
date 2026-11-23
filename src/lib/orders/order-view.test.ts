import { describe, expect, it } from "vitest";
import { orderViewSchema, trackOrderViewSchema } from "./order-view";

describe("order view schemas", () => {
  it("accepts PostgreSQL timestamps with explicit timezone offsets", () => {
    const timestamp = "2026-11-22T15:43:17.380493+00:00";
    const history = [
      {
        from_status: null,
        to_status: "pending_payment",
        actor: "customer",
        note: "Commande créée",
        created_at: timestamp,
      },
    ];

    expect(
      orderViewSchema.safeParse({
        number: "VS-2026-000101",
        status: "pending_payment",
        payment_method: "flooz",
        payment_status: "pending",
        customer_name: "Client Test",
        customer_phone: "+22890123456",
        customer_email: null,
        zone_code: "lome",
        city: "Lomé",
        district: "Tokoin",
        landmark: "Marché",
        instructions: null,
        eta_label: "24 h",
        subtotal_fcfa: 98000,
        shipping_fcfa: 1500,
        total_fcfa: 99500,
        created_at: timestamp,
        payment_deadline: timestamp,
        items: [
          {
            product_name: "Produit test",
            variant_label: "Noir",
            sku: "AP5-BLA",
            unit_price_fcfa: 98000,
            quantity: 1,
            line_total_fcfa: 98000,
          },
        ],
        history,
        payment_attempt: {
          method: "flooz",
          msisdn_masked: "+228 90 •• •• 56",
          reference: "SIM-FL-ABC123",
          outcome: "pending",
          expires_at: timestamp,
        },
      }).success,
    ).toBe(true);

    expect(
      trackOrderViewSchema.safeParse({
        number: "VS-2026-000101",
        status: "pending_payment",
        payment_status: "pending",
        city: "Lomé",
        eta_label: "24 h",
        created_at: timestamp,
        items: [
          {
            product_name: "Produit test",
            variant_label: "Noir",
            quantity: 1,
            line_total_fcfa: 98000,
          },
        ],
        history,
      }).success,
    ).toBe(true);
  });
});
