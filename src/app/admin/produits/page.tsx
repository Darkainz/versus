import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Produits", robots: { index: false, follow: false } };

export default async function AdminProductsPage() {
  await requireAdmin("/admin/produits");
  const supabase = await createSupabaseServerClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, code, slug, name, is_active")
    .order("name");
  if (error) throw new Error("Impossible de charger les produits.", { cause: error });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-h2">Produits</h1>
        <Link className="min-h-11 font-semibold underline" href="/admin/produits/nouveau">
          Nouveau produit
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="mt-6 text-muted">Aucun produit.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line-soft p-5"
            >
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted">
                  {product.code} · {product.is_active ? "Actif" : "Inactif"}
                </p>
              </div>
              <div className="flex gap-4 text-sm">
                <Link className="underline" href={`/admin/produits/${product.id}`}>
                  Modifier
                </Link>
                <Link className="underline" href={`/admin/produits/${product.id}/apercu`}>
                  Aperçu
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
