import { z } from "zod";
import { normalizeTogoPhone } from "@/lib/format/phone";

export const profileSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    phone: z
      .string()
      .trim()
      .transform((value, context) => {
        if (!value) return null;
        const phone = normalizeTogoPhone(value);
        if (!phone) {
          context.addIssue({ code: "custom", message: "Numéro togolais invalide." });
          return z.NEVER;
        }
        return phone;
      }),
  })
  .strict();
