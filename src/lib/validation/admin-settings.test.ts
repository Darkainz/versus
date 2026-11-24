import { describe, expect, it } from "vitest";
import { parseDeliverySettingsForm, parseHomeSlotForm } from "./admin-settings";

const zoneCodes = ["lome", "maritime", "plateaux", "centrale", "kara", "savanes"];

function deliveryForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  for (const code of zoneCodes) {
    formData.append("code", code);
    formData.set(`fee_${code}`, "1500");
    formData.set(`free_${code}`, "");
    formData.set(`eta_${code}`, "1 à 3 jours");
  }
  formData.set("shop", "on");
  formData.set("banner_text", "Projet pédagogique.");
  formData.set("cod_max_fcfa", "500000");
  formData.set("payment_ttl_minutes", "30");
  formData.set("attempt_ttl_seconds", "120");
  formData.set("max_qty_per_line", "5");
  formData.set("max_orders_per_phone_hour", "5");
  formData.set("max_open_cod_per_phone", "2");
  formData.set("max_orders_per_hour", "60");
  for (const [name, value] of Object.entries(overrides)) formData.set(name, value);
  return formData;
}

describe("parseDeliverySettingsForm", () => {
  it("parses every delivery zone and all persisted shop settings", () => {
    const parsed = parseDeliverySettingsForm(deliveryForm());

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.zones).toHaveLength(6);
    expect(parsed.data.zones[0]).toMatchObject({
      code: "lome",
      fee_fcfa: 1500,
      free_from_fcfa: null,
    });
    expect(parsed.data.settings.max_qty_per_line).toBe(5);
  });

  it("rejects missing zones and values outside database constraints", () => {
    const missingZone = new FormData();
    const tooManyItems = deliveryForm({ max_qty_per_line: "6" });
    const invalidFee = deliveryForm({ fee_lome: "-1" });

    expect(parseDeliverySettingsForm(missingZone).success).toBe(false);
    expect(parseDeliverySettingsForm(tooManyItems).success).toBe(false);
    expect(parseDeliverySettingsForm(invalidFee).success).toBe(false);
  });
});

describe("parseHomeSlotForm", () => {
  it("parses validated home slot fields without accepting arbitrary slot values", () => {
    const formData = new FormData();
    formData.set("id", "00000000-0000-4000-8000-000000000001");
    formData.set("product_id", "00000000-0000-4000-8000-000000000002");
    formData.set("slot", "hero");
    formData.set("position", "0");
    formData.set("theme_key", "default");
    formData.set("headline", "");
    formData.set("subline", "");

    const parsed = parseHomeSlotForm(formData);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.is_active).toBe(false);

    formData.set("slot", "unsupported");
    expect(parseHomeSlotForm(formData).success).toBe(false);
  });
});
