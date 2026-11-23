import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

type AdminStats = {
  orders_pending: number;
  orders_preparing: number;
  orders_shipped: number;
  stock_out: number;
  stock_low: number;
  revenue_day: number;
  revenue_week: number;
  revenue_month: number;
  latest_orders: readonly {
    number: string;
    status: string;
    payment_status: string;
    total_fcfa: number;
    created_at: string;
  }[];
};

function numberFrom(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error)
    throw new Error("Impossible de charger les indicateurs administratifs.", { cause: error });

  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const latestOrders = Array.isArray(record.latest_orders)
    ? record.latest_orders.filter(
        (order): order is AdminStats["latest_orders"][number] =>
          typeof order === "object" &&
          order !== null &&
          typeof (order as Record<string, unknown>).number === "string",
      )
    : [];
  const stats: AdminStats = {
    orders_pending: numberFrom(record.orders_pending),
    orders_preparing: numberFrom(record.orders_preparing),
    orders_shipped: numberFrom(record.orders_shipped),
    stock_out: numberFrom(record.stock_out),
    stock_low: numberFrom(record.stock_low),
    revenue_day: numberFrom(record.revenue_day),
    revenue_week: numberFrom(record.revenue_week),
    revenue_month: numberFrom(record.revenue_month),
    latest_orders: latestOrders,
  };

  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Tableau de bord</h1>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Paiements en attente", stats.orders_pending],
          ["Commandes en préparation", stats.orders_preparing],
          ["Commandes expédiées", stats.orders_shipped],
          ["Ruptures", stats.stock_out],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-card border border-line-soft bg-surface p-5">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-2 text-2xl font-bold">{String(value)}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 text-lg font-semibold">Dernières commandes</h2>
      {stats.latest_orders.length === 0 ? (
        <p className="mt-4 text-muted">Aucune commande.</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {stats.latest_orders.map((order) => (
            <li key={order.number} className="rounded-card border border-line-soft p-4">
              <a
                className="font-semibold underline"
                href={`/admin/commandes/${encodeURIComponent(order.number)}`}
              >
                {order.number}
              </a>
              <p className="mt-1 text-sm text-muted">
                {order.status} · {order.payment_status}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
