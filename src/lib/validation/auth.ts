import { z } from "zod";
import { normalizeTogoPhone } from "@/lib/format/phone";

const email = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email())
  .transform((value) => value.toLowerCase());

const password = z.string().min(8).max(128);

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .transform((value, context) => {
    if (!value) return null;
    const phone = normalizeTogoPhone(value);
    if (!phone) {
      context.addIssue({ code: "custom", message: "Numéro togolais invalide." });
      return z.NEVER;
    }
    return phone;
  });

export const signInSchema = z.object({ email, password, redirect: z.string().optional() }).strict();

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    email,
    password,
    phone: optionalPhone,
    privacy_accepted: z.literal("on", "La case de confidentialité est obligatoire."),
  })
  .strict();

export const passwordResetRequestSchema = z.object({ email }).strict();

export const passwordUpdateSchema = z
  .object({
    password,
    password_confirmation: z.string(),
  })
  .strict()
  .refine((value) => value.password === value.password_confirmation, {
    path: ["password_confirmation"],
    message: "Les mots de passe ne correspondent pas.",
  });
