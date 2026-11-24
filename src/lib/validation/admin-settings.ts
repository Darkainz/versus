import { z } from "zod";

const zoneCodeSchema = z.enum(["lome", "maritime", "plateaux", "centrale", "kara", "savanes"]);
const integerString = z.string().regex(/^\d+$/).transform(Number);
const nonNegativeInteger = integerString.pipe(z.number().int().min(0).max(2_147_483_647));
const positiveInteger = integerString.pipe(z.number().int().min(1).max(32_767));

const deliveryZoneSchema = z.object({
  code: zoneCodeSchema,
  fee_fcfa: nonNegativeInteger,
  free_from_fcfa: z.union([
    z.literal("").transform(() => null),
    integerString.pipe(z.number().int().min(1).max(2_147_483_647)),
  ]),
  eta_label: z.string().trim().min(1).max(120),
});

const shopSettingsSchema = z.object({
  banner_text: z.string().trim().min(1).max(300),
  cod_max_fcfa: integerString.pipe(z.number().int().min(1).max(2_147_483_647)),
  payment_ttl_minutes: integerString.pipe(z.number().int().min(1).max(1440)),
  attempt_ttl_seconds: positiveInteger,
  max_qty_per_line: integerString.pipe(z.number().int().min(1).max(5)),
  max_orders_per_phone_hour: positiveInteger,
  max_open_cod_per_phone: positiveInteger,
  max_orders_per_hour: positiveInteger,
});

const deliverySettingsFormSchema = z
  .object({
    zones: z.array(deliveryZoneSchema).length(6),
    shop: z.literal("on"),
    settings: shopSettingsSchema,
  })
  .superRefine(({ zones }, context) => {
    const codes = zones.map((zone) => zone.code);
    if (new Set(codes).size !== codes.length) {
      context.addIssue({
        code: "custom",
        path: ["zones"],
        message: "Chaque zone ne doit apparaître qu’une fois.",
      });
    }
  });

const homeSlotSchema = z.object({
  id: z.uuid(),
  product_id: z.uuid(),
  slot: z.enum(["hero", "tile", "rail", "compare"]),
  position: integerString.pipe(z.number().int().min(0).max(32_767)),
  theme_key: z.string().trim().min(1).max(60),
  headline: z.string().trim().max(120),
  subline: z.string().trim().max(300),
  is_active: z.boolean(),
});

function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function parseDeliverySettingsForm(formData: FormData) {
  const zones = formData.getAll("code").map((value) => {
    const code = typeof value === "string" ? value : "";
    return {
      code,
      fee_fcfa: getString(formData, `fee_${code}`),
      free_from_fcfa: getString(formData, `free_${code}`),
      eta_label: getString(formData, `eta_${code}`),
    };
  });

  return deliverySettingsFormSchema.safeParse({
    zones,
    shop: getString(formData, "shop"),
    settings: {
      banner_text: getString(formData, "banner_text"),
      cod_max_fcfa: getString(formData, "cod_max_fcfa"),
      payment_ttl_minutes: getString(formData, "payment_ttl_minutes"),
      attempt_ttl_seconds: getString(formData, "attempt_ttl_seconds"),
      max_qty_per_line: getString(formData, "max_qty_per_line"),
      max_orders_per_phone_hour: getString(formData, "max_orders_per_phone_hour"),
      max_open_cod_per_phone: getString(formData, "max_open_cod_per_phone"),
      max_orders_per_hour: getString(formData, "max_orders_per_hour"),
    },
  });
}

export function parseHomeSlotForm(formData: FormData) {
  return homeSlotSchema.safeParse({
    id: getString(formData, "id"),
    product_id: getString(formData, "product_id"),
    slot: getString(formData, "slot"),
    position: getString(formData, "position"),
    theme_key: getString(formData, "theme_key"),
    headline: getString(formData, "headline"),
    subline: getString(formData, "subline"),
    is_active: getString(formData, "is_active") === "on",
  });
}
