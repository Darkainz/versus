import { Constants } from "@/lib/database.types";

export const PAYMENT_METHODS = Constants.public.Enums.payment_method;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
