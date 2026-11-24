import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { CancelOrderButton } from "@/components/account/CancelOrderButton";
import { PaymentSimulator } from "@/components/checkout/PaymentSimulator";
import { Price } from "@/components/ui/Price";
import { requireUser } from "@/lib/auth/dal";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/labels";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Détail de commande",
  robots: { index: false, follow: false },
};

async function OrderContent({ number }: { number: string }) {
  if (!ORDER_NUMBER_PATTERN.test(number)) notFound();
  const user = await requireUser(`/compte/commandes/${number}`);
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, number, status, payment_status, payment_method, payment_deadline, subtotal_fcfa, shipping_fcfa, total_fcfa, created_at, order_items(product_name, variant_label, sku, quantity, unit_price_fcfa, line_total_fcfa)",
    )
    .eq("number", number)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger le détail de la commande.", { cause: error });
  if (!order) notFound();
  if (order.total_fcfa === null) throw new Error("La commande ne contient pas de total valide.");
  const { data: attempts, error: attemptError } = await supabase
    .from("payment_attempts")
    .select("method, msisdn_masked, reference, outcome, expires_at")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1);
  if (attemptError) {
    throw new Error("Impossible de charger la tentative de paiement.", { cause: attemptError });
  }
  const attempt = attempts?.[0] ?? null;
  const validItems = order.order_items.map((item) => {
    if (item.line_total_fcfa === null) {
      throw new Error("Une ligne de commande ne contient pas de total valide.");
    }
    return { ...item, line_total_fcfa: item.line_total_fcfa };
  });

  return (
    <>
      <dl className="mt-6 grid gap-3 rounded-card border border-line-soft bg-surface p-5 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-muted">État</dt>
          <dd className="font-semibold">{ORDER_STATUS_LABELS[order.status]}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Paiement</dt>
          <dd>{PAYMENT_STATUS_LABELS[order.payment_status]}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Moyen choisi</dt>
          <dd>{PAYMENT_METHOD_LABELS[order.payment_method]}</dd>
        </div>
      </dl>
      <ul className="mt-6 divide-y divide-line-soft rounded-card border border-line-soft bg-surface px-5">
        {validItems.map((item) => (
          <li key={item.sku} className="flex flex-wrap justify-between gap-3 py-4">
            <span>
              {item.product_name} · {item.variant_label} × {item.quantity}
            </span>
            <Price amount={item.line_total_fcfa} />
          </li>
        ))}
      </ul>
      <dl className="mt-5 ml-auto grid max-w-sm gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Sous-total</dt>
          <dd>
            <Price amount={order.subtotal_fcfa} />
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Livraison</dt>
          <dd>
            <Price amount={order.shipping_fcfa} />
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line-soft pt-3 font-semibold">
          <dt>Total simulé</dt>
          <dd>
            <Price amount={order.total_fcfa} />
          </dd>
        </div>
      </dl>
      {order.status === "pending_payment" ? (
        <PaymentSimulator
          number={order.number}
          total={order.total_fcfa}
          paymentMethod={order.payment_method}
          paymentDeadline={order.payment_deadline}
          attempt={attempt}
          status={order.status}
        />
      ) : null}
      {order.status === "pending_payment" || order.status === "confirmed" ? (
        <CancelOrderButton number={order.number} />
      ) : null}
      <Link href="/compte/commandes" className="mt-7 inline-flex min-h-11 items-center underline">
        Retour à mes commandes
      </Link>
    </>
  );
}

async function OrderDetailContent({
  params,
}: {
  params: PageProps<"/compte/commandes/[numero]">["params"];
}) {
  const { numero } = await params;
  return (
    <>
      <h1 className="text-display-h2">Commande {numero}</h1>
      <OrderContent number={numero} />
    </>
  );
}

export default function OrderDetailPage(props: PageProps<"/compte/commandes/[numero]">) {
  return (
    <div className="wrap section">
      <Suspense fallback={<p className="mt-6 text-muted">Chargement de la commande…</p>}>
        <OrderDetailContent params={props.params} />
      </Suspense>
    </div>
  );
}
