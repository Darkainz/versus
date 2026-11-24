import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductSpecsForm } from "@/components/admin/ProductSpecsForm";
import { VariantForm } from "@/components/admin/VariantForm";
import { ImageUploader } from "@/components/admin/ImageUploader";

export const metadata: Metadata = {
  title: "Modifier un produit",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({ params }: PageProps<"/admin/produits/[id]">) {
  await requireAdmin("/admin/produits");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [
    { data: product, error: productError },
    { data: brands, error: brandsError },
    { data: categories, error: categoriesError },
    { data: variants, error: variantsError },
    { data: specs, error: specsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("brands").select("slug, name").order("position").order("name"),
    supabase.from("categories").select("slug, name").order("position").order("name"),
    supabase
      .from("product_variants")
      .select(
        "id, sku, color_name, color_slug, color_hex, storage_gb, size_mm, price_fcfa, stock, low_stock_threshold, is_active, is_default",
      )
      .eq("product_id", id)
      .order("position"),
    supabase.from("product_specs").select("*").eq("product_id", id).maybeSingle(),
    supabase
      .from("product_images")
      .select("id, src, alt, width, height, is_primary")
      .eq("product_id", id)
      .order("position"),
  ]);
  if (
    productError ||
    brandsError ||
    categoriesError ||
    variantsError ||
    specsError ||
    imagesError
  ) {
    throw new Error("Impossible de charger le produit.");
  }
  if (!product) notFound();
  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Modifier {product.name}</h1>
      <ProductForm product={product} brands={brands ?? []} categories={categories ?? []} />
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Variantes</h2>
        {(variants ?? []).length ? (
          <ul className="mt-4 grid gap-2">
            {variants?.map((variant) => (
              <li key={variant.id} className="rounded-card border border-line-soft p-4 text-sm">
                <details>
                  <summary className="cursor-pointer">
                    <strong>{variant.sku}</strong> · {variant.color_name}
                    {variant.storage_gb ? ` · ${variant.storage_gb} Go` : ""}
                    {variant.size_mm ? ` · ${variant.size_mm} mm` : ""}
                    <span className="block text-muted">
                      {variant.price_fcfa} FCFA · stock {variant.stock} · seuil bas{" "}
                      {variant.low_stock_threshold} · {variant.is_active ? "active" : "inactive"}
                      {variant.is_default ? " · par défaut" : ""}
                    </span>
                  </summary>
                  <VariantForm
                    productId={product.id}
                    categorySlug={product.category_slug}
                    variant={variant}
                  />
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-muted">Aucune variante.</p>
        )}
        <VariantForm productId={product.id} categorySlug={product.category_slug} />
      </section>
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Spécifications</h2>
        <ProductSpecsForm productId={product.id} specs={specs} />
      </section>
      <ImageUploader productId={product.id} images={images ?? []} />
    </div>
  );
}
