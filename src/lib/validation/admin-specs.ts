import { z } from "zod";

const optionalSmallint = z.union([
  z.literal("").transform(() => null),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(32_767)),
]);
const optionalInteger = z.union([
  z.literal("").transform(() => null),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(2_147_483_647)),
]);
const optionalScreenSize = z.union([
  z.literal("").transform(() => null),
  z
    .string()
    .regex(/^\d+(?:\.\d{1,2})?$/)
    .transform(Number)
    .pipe(z.number().gt(0).max(9.99)),
]);
const optionalWeight = z.union([
  z.literal("").transform(() => null),
  z
    .string()
    .regex(/^\d+(?:\.\d)?$/)
    .transform(Number)
    .pipe(z.number().gt(0).max(9999.9)),
]);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || null);
const optionalBoolean = z
  .enum(["", "true", "false"])
  .transform((value) => (value === "" ? null : value === "true"));

const productSpecsSchema = z.object({
  product_id: z.uuid(),
  screen_size_in: optionalScreenSize,
  screen_tech: optionalText(60),
  refresh_hz: optionalSmallint,
  chip: optionalText(120),
  battery_mah: optionalInteger,
  autonomy_hours: optionalInteger,
  charging_w: optionalSmallint,
  main_camera_mp: optionalSmallint,
  weight_g: optionalWeight,
  ip_rating: optionalText(30),
  has_5g: optionalBoolean,
  has_anc: optionalBoolean,
  specs_note: z.string().trim().min(1).max(500),
});

function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function parseProductSpecsForm(formData: FormData) {
  return productSpecsSchema.safeParse({
    product_id: getString(formData, "product_id"),
    screen_size_in: getString(formData, "screen_size_in"),
    screen_tech: getString(formData, "screen_tech"),
    refresh_hz: getString(formData, "refresh_hz"),
    chip: getString(formData, "chip"),
    battery_mah: getString(formData, "battery_mah"),
    autonomy_hours: getString(formData, "autonomy_hours"),
    charging_w: getString(formData, "charging_w"),
    main_camera_mp: getString(formData, "main_camera_mp"),
    weight_g: getString(formData, "weight_g"),
    ip_rating: getString(formData, "ip_rating"),
    has_5g: getString(formData, "has_5g"),
    has_anc: getString(formData, "has_anc"),
    specs_note: getString(formData, "specs_note"),
  });
}
