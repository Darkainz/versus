import { z } from "zod";
import { ORDER_STATUSES } from "./transitions";
import { PAYMENT_METHODS } from "./payment-methods";

export const ORDER_NUMBER_PATTERN = /^VS-[0-9]{4}-[0-9]{6}$/;

const paymentStatuses = [
  "pending",
  "succeeded",
  "failed",
  "expired",
  "cash_due",
  "cash_collected",
] as const;
const attemptOutcomes = ["pending", "succeeded", "failed", "expired"] as const;
const actors = ["customer", "admin", "system"] as const;
const timestampSchema = z.iso.datetime({ offset: true });

const orderItemSchema = z.object({
  product_name: z.string(),
  variant_label: z.string(),
  sku: z.string().optional(),
  unit_price_fcfa: z.number().int().nonnegative().optional(),
  quantity: z.number().int().positive(),
  line_total_fcfa: z.number().int().nonnegative(),
});

const historySchema = z.object({
  from_status: z.enum(ORDER_STATUSES).nullable(),
  to_status: z.enum(ORDER_STATUSES),
  actor: z.enum(actors),
  note: z.string().nullable(),
  created_at: timestampSchema,
});

export const orderViewSchema = z.object({
  number: z.string().regex(ORDER_NUMBER_PATTERN),
  status: z.enum(ORDER_STATUSES),
  payment_method: z.enum(PAYMENT_METHODS),
  payment_status: z.enum(paymentStatuses),
  customer_name: z.string(),
  customer_phone: z.string().regex(/^\+228[0-9]{8}$/),
  customer_email: z.string().email().nullable(),
  zone_code: z.string(),
  city: z.string(),
  district: z.string(),
  landmark: z.string(),
  instructions: z.string().nullable(),
  eta_label: z.string(),
  subtotal_fcfa: z.number().int().nonnegative(),
  shipping_fcfa: z.number().int().nonnegative(),
  total_fcfa: z.number().int().nonnegative(),
  created_at: timestampSchema,
  payment_deadline: timestampSchema.nullable(),
  items: z.array(orderItemSchema),
  history: z.array(historySchema),
  payment_attempt: z
    .object({
      method: z.enum(PAYMENT_METHODS),
      msisdn_masked: z.string().nullable(),
      reference: z.string().regex(/^SIM-(TM|FL|CB)-[A-Z0-9]{6}$/),
      outcome: z.enum(attemptOutcomes),
      expires_at: timestampSchema,
    })
    .nullable(),
});
export type OrderView = z.infer<typeof orderViewSchema>;

export const trackOrderViewSchema = z.object({
  number: z.string().regex(ORDER_NUMBER_PATTERN),
  status: z.enum(ORDER_STATUSES),
  payment_status: z.enum(paymentStatuses),
  city: z.string(),
  eta_label: z.string(),
  created_at: timestampSchema,
  items: z.array(
    z.object({
      product_name: z.string(),
      variant_label: z.string(),
      quantity: z.number().int().positive(),
      line_total_fcfa: z.number().int().nonnegative(),
    }),
  ),
  history: z.array(historySchema),
});
export type TrackOrderView = z.infer<typeof trackOrderViewSchema>;
