import { describe, expect, it } from "vitest";
import { parseProductSpecsForm } from "./admin-specs";

function specsForm(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("product_id", "00000000-0000-4000-8000-000000000001");
  for (const field of [
    "screen_size_in",
    "screen_tech",
    "refresh_hz",
    "chip",
    "battery_mah",
    "autonomy_hours",
    "charging_w",
    "main_camera_mp",
    "weight_g",
    "ip_rating",
    "has_5g",
    "has_anc",
  ]) {
    formData.set(field, "");
  }
  formData.set("specs_note", "Valeurs indicatives.");
  for (const [name, value] of Object.entries(overrides)) formData.set(name, value);
  return formData;
}

describe("parseProductSpecsForm", () => {
  it("converts optional values and preserves explicit false separately from unknown", () => {
    const parsed = parseProductSpecsForm(
      specsForm({
        screen_size_in: "6.7",
        screen_tech: " OLED ",
        refresh_hz: "120",
        weight_g: "190.5",
        has_5g: "false",
      }),
    );

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      screen_size_in: 6.7,
      screen_tech: "OLED",
      refresh_hz: 120,
      weight_g: 190.5,
      has_5g: false,
      has_anc: null,
      battery_mah: null,
    });
  });

  it("rejects values outside database precision and range constraints", () => {
    expect(parseProductSpecsForm(specsForm({ screen_size_in: "10.00" })).success).toBe(false);
    expect(parseProductSpecsForm(specsForm({ weight_g: "12.34" })).success).toBe(false);
    expect(parseProductSpecsForm(specsForm({ refresh_hz: "0" })).success).toBe(false);
    expect(parseProductSpecsForm(specsForm({ has_5g: "unknown" })).success).toBe(false);
  });
});
