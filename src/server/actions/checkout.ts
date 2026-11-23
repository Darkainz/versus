"use server";

import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/public";
import {
  checkoutFormSchema,
  resolvePaymentFormSchema,
  startPaymentFormSchema,
  trackOrderFormSchema,
} from "@/lib/validation/checkout";
import { orderTokenCookieName, getOrderForViewer, getOrderToken } from "@/lib/orders/queries";
import { trackOrderViewSchema } from "@/lib/orders/order-view";
import type {
  CheckoutActionState,
  PaymentActionState,
  TrackingActionState,
} from "@/lib/orders/action-state";
import type { OrderErrorCode } from "@/lib/orders/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function rpcError(message: string): { error: OrderErrorCode; sku?: string } {
  const outOfStock = message.match(/^VS_OUT_OF_STOCK:([A-Z0-9-]+)$/);
  if (outOfStock) return { error: "VS_OUT_OF_STOCK", sku: outOfStock[1] };

  const code = message.split(":", 1)[0] as OrderErrorCode;
  const knownCodes: readonly OrderErrorCode[] = [
    "VS_ACK_REQUIRED",
    "VS_ATTEMPT_RESOLVED",
    "VS_COD_CAP",
    "VS_EXPIRED",
    "VS_INVALID",
    "VS_INVALID_ZONE",
    "VS_NOT_FOUND",
    "VS_NOT_PAYABLE",
    "VS_OUT_OF_STOCK",
    "VS_PAYMENT_FAILED",
    "VS_RATE_LIMITED",
    "VS_REFERENCE_FAILED",
    "VS_UNAVAILABLE",
  ];
  if (knownCodes.includes(code)) return { error: code };
  console.error("Erreur RPC de commande non reconnue :", message);
  return { error: "VS_UNAVAILABLE" };
}

function checkoutInput(formData: FormData) {
  return {
    idempotency_key: formString(formData, "idempotency_key"),
    items: formString(formData, "items"),
    customer_name: formString(formData, "customer_name"),
    customer_phone: formString(formData, "customer_phone"),
    customer_email: formString(formData, "customer_email"),
    zone_code: formString(formData, "zone_code"),
    city: formString(formData, "city"),
    district: formString(formData, "district"),
    landmark: formString(formData, "landmark"),
    instructions: formString(formData, "instructions"),
    payment_method: formString(formData, "payment_method"),
    fictitious_ack: formData.get("fictitious_ack") === "on",
  };
}

export async function placeOrder(
  _previous: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutFormSchema.safeParse(checkoutInput(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues.some((issue) => issue.path[0] === "fictitious_ack")
        ? "VS_ACK_REQUIRED"
        : "VS_INVALID",
    };
  }
  if (!isSupabaseConfigured) return { error: "VS_UNAVAILABLE" };

  const input = parsed.data;
  const { data, error } = await supabase.rpc("create_order", {
    p_idempotency_key: input.idempotency_key,
    p_items: input.items,
    p_customer: {
      name: input.customer_name,
      phone: input.customer_phone,
      email: input.customer_email,
    },
    p_delivery: {
      zone_code: input.zone_code,
      city: input.city,
      district: input.district,
      landmark: input.landmark,
      instructions: input.instructions || null,
    },
    p_method: input.payment_method,
    p_fictitious_ack: true,
  });
  if (error) return rpcError(error.message);
  const order = data?.[0];
  if (!order) {
    console.error("La RPC create_order n'a renvoyé aucune commande.");
    return { error: "VS_UNAVAILABLE" };
  }

  const cookieName = orderTokenCookieName(order.order_number);
  if (!cookieName) throw new Error("Numéro de commande invalide renvoyé par Supabase.");
  const cookieStore = await cookies();
  if (order.access_token) {
    cookieStore.set(cookieName, order.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/commande/${order.order_number}`,
      maxAge: 60 * 60 * 24 * 7,
    });
    revalidateTag("catalog", "max");
  } else if (!cookieStore.get(cookieName)) {
    redirect("/suivi");
  }

  redirect(
    order.status === "confirmed"
      ? `/commande/${order.order_number}/confirmation`
      : `/commande/${order.order_number}/paiement`,
  );
}

export async function startPayment(
  _previous: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = startPaymentFormSchema.safeParse({
    number: formString(formData, "number"),
    method: formString(formData, "method"),
    msisdn: formString(formData, "msisdn") || undefined,
  });
  if (!parsed.success) return { error: "VS_INVALID" };
  if (!isSupabaseConfigured) return { error: "VS_UNAVAILABLE" };

  const token = await getOrderToken(parsed.data.number);
  const serverClient = await createSupabaseServerClient();
  const { data, error } = await serverClient.rpc("start_payment", {
    p_number: parsed.data.number,
    p_token: token ?? "",
    p_method: parsed.data.method,
    p_msisdn: parsed.data.msisdn ?? undefined,
  });
  if (error) return rpcError(error.message);
  if (data?.length) redirect(`/commande/${parsed.data.number}/paiement`);

  const order = await getOrderForViewer(parsed.data.number);
  if (order?.status === "confirmed") redirect(`/commande/${parsed.data.number}/confirmation`);
  if (order?.status === "cancelled") redirect(`/commande/${parsed.data.number}/paiement`);
  return { error: "VS_NOT_PAYABLE" };
}

export async function resolvePayment(
  _previous: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const parsed = resolvePaymentFormSchema.safeParse({
    number: formString(formData, "number"),
    reference: formString(formData, "reference"),
    outcome: formString(formData, "outcome"),
  });
  if (!parsed.success) return { error: "VS_INVALID" };
  if (!isSupabaseConfigured) return { error: "VS_UNAVAILABLE" };

  const token = await getOrderToken(parsed.data.number);
  const serverClient = await createSupabaseServerClient();
  const { data, error } = await serverClient.rpc("resolve_payment", {
    p_number: parsed.data.number,
    p_token: token ?? "",
    p_reference: parsed.data.reference,
    p_outcome: parsed.data.outcome,
  });
  if (error) return rpcError(error.message);
  if (!data || parsed.data.outcome === "failed") {
    redirect(`/commande/${parsed.data.number}/paiement`);
  }

  revalidateTag("catalog", "max");
  redirect(`/commande/${parsed.data.number}/confirmation`);
}

export async function trackOrder(
  _previous: TrackingActionState,
  formData: FormData,
): Promise<TrackingActionState> {
  const parsed = trackOrderFormSchema.safeParse({
    number: formString(formData, "number"),
    phone: formString(formData, "phone"),
  });
  if (!parsed.success) return { error: "VS_INVALID", order: null };
  if (!isSupabaseConfigured) return { error: "VS_UNAVAILABLE", order: null };

  const { data, error } = await supabase.rpc("track_order", {
    p_number: parsed.data.number,
    p_phone: parsed.data.phone,
  });
  if (error) return { ...rpcError(error.message), order: null };
  if (data === null) return { error: "VS_NOT_FOUND", order: null };

  const order = trackOrderViewSchema.safeParse(data);
  if (!order.success) {
    console.error("La RPC track_order a renvoyé une réponse invalide.");
    return { error: "VS_UNAVAILABLE", order: null };
  }
  return { error: null, order: order.data };
}
