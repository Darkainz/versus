import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/orders/payment-methods";
import { normalizeTogoPhone } from "@/lib/format/phone";
import { SKU_PATTERN } from "@/lib/cart/sku";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-view";
import { maxQuantityPerLine } from "@/config/cart-limits";
import { MAX_ORDER_LINES } from "@/lib/orders/limits";

const phoneSchema = z.string().transform((value, context) => {
  const normalized = normalizeTogoPhone(value);
  if (!normalized) {
    context.addIssue({ code: "custom", message: "Numéro togolais invalide." });
    return z.NEVER;
  }
  return normalized;
});

const emailSchema = z
  .string()
  .max(254)
  .refine((value) => value === "" || z.email().safeParse(value).success, "Adresse e-mail invalide.")
  .transform((value) => value || null);

const linesSchema = z
  .string()
  .transform((value, context) => {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      context.addIssue({ code: "custom", message: "Lignes de panier invalides." });
      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(
        z
          .object({
            sku: z.string().regex(SKU_PATTERN),
            qty: z.number().int().min(1).max(maxQuantityPerLine),
          })
          .strict(),
      )
      .min(1)
      .max(MAX_ORDER_LINES),
  );

export const checkoutFormSchema = z
  .object({
    idempotency_key: z.string().uuid(),
    items: linesSchema,
    customer_name: z.string().trim().min(2).max(120),
    customer_phone: phoneSchema,
    customer_email: emailSchema,
    zone_code: z.enum(["lome", "maritime", "plateaux", "centrale", "kara", "savanes"]),
    city: z.string().trim().min(1).max(100),
    district: z.string().trim().min(1).max(100),
    landmark: z.string().trim().min(1).max(200),
    instructions: z.string().trim().max(500),
    payment_method: z.enum(PAYMENT_METHODS),
    fictitious_ack: z.literal(true),
  })
  .strict();

export const startPaymentFormSchema = z
  .object({
    number: z.string().regex(ORDER_NUMBER_PATTERN),
    method: z.enum(PAYMENT_METHODS),
    msisdn: z.string().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.method === "tmoney" || value.method === "flooz") {
      if (!value.msisdn || !normalizeTogoPhone(value.msisdn)) {
        context.addIssue({
          code: "custom",
          path: ["msisdn"],
          message: "Saisissez un numéro togolais valide.",
        });
      }
    } else if (value.msisdn) {
      context.addIssue({
        code: "custom",
        path: ["msisdn"],
        message: "Aucun numéro n'est nécessaire pour ce moyen de paiement.",
      });
    }
  })
  .transform((value) => ({
    ...value,
    msisdn:
      value.method === "tmoney" || value.method === "flooz"
        ? normalizeTogoPhone(value.msisdn ?? "")
        : null,
  }));

export const resolvePaymentFormSchema = z
  .object({
    number: z.string().regex(ORDER_NUMBER_PATTERN),
    reference: z.string().regex(/^SIM-(TM|FL|CB)-[A-Z0-9]{6}$/),
    outcome: z.enum(["succeeded", "failed"]),
  })
  .strict();

export const trackOrderFormSchema = z
  .object({
    number: z.string().regex(ORDER_NUMBER_PATTERN),
    phone: phoneSchema,
  })
  .strict();

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
export type StartPaymentFormInput = z.infer<typeof startPaymentFormSchema>;
export type ResolvePaymentFormInput = z.infer<typeof resolvePaymentFormSchema>;
export type TrackOrderFormInput = z.infer<typeof trackOrderFormSchema>;
