import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StockAdjustForm } from "@/components/admin/StockAdjustForm";

export const metadata: Metadata = {
  title: "Gestion du stock",
  robots: { index: false, follow: false },
};

export default async function AdminStockPage() {
  await requireAdmin("/admin/stock");
  const supabase = await createSupabaseServerClient();
  const { data: variants, error } = await supabase
    .from("product_variants")
    .select("id, sku, stock, is_active")
    .order("sku");
  if (error) throw new Error("Impossible de charger les stocks.", { cause: error });

  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Gestion du stock</h1>
      {variants.length === 0 ? (
        <p className="mt-6 text-muted">Aucune variante.</p>
      ) : (
        <ul className="mt-6 grid gap-4">
          {variants.map((variant) => (
            <li key={variant.id} className="rounded-card border border-line-soft bg-surface p-5">
              <StockAdjustForm variantId={variant.id} sku={variant.sku} stock={variant.stock} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
