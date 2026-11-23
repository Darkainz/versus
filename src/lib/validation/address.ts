import { z } from "zod";
import { normalizeTogoPhone } from "@/lib/format/phone";

export const addressSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().trim().min(1).max(60),
    recipient_name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .transform((value, context) => {
        const phone = normalizeTogoPhone(value);
        if (!phone) {
          context.addIssue({ code: "custom", message: "Numéro togolais invalide." });
          return z.NEVER;
        }
        return phone;
      }),
    zone_code: z.string().regex(/^[a-z]{2,20}$/, "Choisissez une zone de livraison."),
    city: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    landmark: z.string().trim().min(1).max(200),
    instructions: z
      .string()
      .trim()
      .max(500)
      .transform((value) => value || null),
    is_default: z.boolean(),
  })
  .strict();

export type AddressInput = z.infer<typeof addressSchema>;
