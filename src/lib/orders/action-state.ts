import type { OrderErrorCode } from "./errors";
import type { TrackOrderView } from "./order-view";

export type CheckoutActionState = {
  error: OrderErrorCode | null;
  sku?: string;
};

export type PaymentActionState = {
  error: OrderErrorCode | null;
};

export type TrackingActionState = {
  error: OrderErrorCode | null;
  order: TrackOrderView | null;
};

export const initialCheckoutActionState: CheckoutActionState = { error: null };
export const initialPaymentActionState: PaymentActionState = { error: null };
export const initialTrackingActionState: TrackingActionState = { error: null, order: null };
