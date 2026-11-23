import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Commandes", robots: { index: false, follow: false } };

export default async function AdminOrdersPage() {
  await requireAdmin("/admin/commandes");
  const supabase = await createSupabaseServerClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, number, status, payment_status, total_fcfa, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Impossible de charger les commandes.", { cause: error });

  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Commandes</h1>
      {orders.length === 0 ? (
        <p className="mt-6 text-muted">Aucune commande.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-card border border-line-soft p-5">
              <Link
                className="font-semibold underline"
                href={`/admin/commandes/${encodeURIComponent(order.number)}`}
              >
                {order.number}
              </Link>
              <p className="mt-2 text-sm text-muted">
                {order.status} · {order.payment_status} · {order.total_fcfa} FCFA
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
