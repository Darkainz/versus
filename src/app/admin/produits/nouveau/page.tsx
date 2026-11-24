import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = {
  title: "Nouveau produit",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  await requireAdmin("/admin/produits/nouveau");
  const supabase = await createSupabaseServerClient();
  const [{ data: brands, error: brandsError }, { data: categories, error: categoriesError }] =
    await Promise.all([
      supabase.from("brands").select("slug, name").order("position").order("name"),
      supabase.from("categories").select("slug, name").order("position").order("name"),
    ]);
  if (brandsError || categoriesError)
    throw new Error("Impossible de charger les référentiels produit.");
  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Nouveau produit</h1>
      <ProductForm brands={brands ?? []} categories={categories ?? []} />
    </div>
  );
}
