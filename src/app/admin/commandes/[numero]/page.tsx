import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OrderStatusActions } from "@/components/admin/OrderStatusActions";

export const metadata: Metadata = {
  title: "Détail commande",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/commandes/[numero]">) {
  await requireAdmin("/admin");
  const { numero } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, number, status, payment_method, payment_status, customer_name, customer_phone, total_fcfa",
    )
    .eq("number", numero)
    .maybeSingle();
  if (error) throw new Error("Impossible de charger la commande.", { cause: error });
  if (!order) notFound();

  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Commande {order.number}</h1>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">Client</dt>
          <dd>{order.customer_name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Téléphone</dt>
          <dd>{order.customer_phone}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Statut</dt>
          <dd>{order.status}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Paiement</dt>
          <dd>{order.payment_status}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted">Total</dt>
          <dd>{order.total_fcfa} FCFA</dd>
        </div>
      </dl>
      <OrderStatusActions
        orderId={order.id}
        status={order.status}
        paymentMethod={order.payment_method}
        paymentStatus={order.payment_status}
      />
    </div>
  );
}
