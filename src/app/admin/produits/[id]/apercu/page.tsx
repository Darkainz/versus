import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProductView } from "@/components/product/ProductView";
import type { ProductDetail } from "@/lib/catalog/types";
import type { Brand, DeviceKind } from "@/lib/brand-themes";

export const metadata: Metadata = {
  title: "Aperçu produit",
  robots: { index: false, follow: false },
};

export default async function AdminProductPreviewPage({
  params,
}: PageProps<"/admin/produits/[id]/apercu">) {
  await requireAdmin("/admin/produits");
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [
    { data: row, error: rowError },
    { data: variants, error: variantsError },
    { data: specs, error: specsError },
    { data: category, error: categoryError },
  ] = await Promise.all([
    supabase.from("catalog_products").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("product_variants")
      .select(
        "sku, color_name, color_slug, color_hex, storage_gb, size_mm, price_fcfa, stock, low_stock_threshold, is_default, is_active, position",
      )
      .eq("product_id", id)
      .order("position"),
    supabase.from("product_specs").select("*").eq("product_id", id).maybeSingle(),
    supabase
      .from("categories")
      .select("name")
      .eq(
        "slug",
        (await supabase.from("products").select("category_slug").eq("id", id).maybeSingle()).data
          ?.category_slug ?? "",
      )
      .maybeSingle(),
  ]);

  if (rowError || variantsError || specsError || categoryError) {
    throw new Error("Impossible de préparer l’aperçu produit.");
  }
  if (!row) notFound();

  const product: ProductDetail = {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description:
      (await supabase.from("products").select("description").eq("id", id).maybeSingle()).data
        ?.description ?? "",
    brand_slug: row.brand_slug as Brand,
    brand_name: row.brand_name,
    category_slug: row.category_slug as ProductDetail["category_slug"],
    compare_group: row.compare_group,
    visual_kind: row.visual_kind as DeviceKind,
    release_date: row.release_date,
    new_until: row.new_until,
    warranty_months: row.warranty_months,
    compat: (row.compat ?? []) as ProductDetail["compat"],
    min_price_fcfa: row.min_price_fcfa,
    max_price_fcfa: row.max_price_fcfa,
    in_stock: Boolean(row.in_stock),
    image_src: row.image_src,
    image_width: row.image_width,
    image_height: row.image_height,
    image_alt: row.image_alt,
    variants: variants ?? [],
    specs: {
      screen_size_in: specs?.screen_size_in ?? undefined,
      screen_tech: specs?.screen_tech ?? undefined,
      refresh_hz: specs?.refresh_hz ?? undefined,
      chip: specs?.chip ?? undefined,
      battery_mah: specs?.battery_mah ?? undefined,
      autonomy_hours: specs?.autonomy_hours ?? undefined,
      charging_w: specs?.charging_w ?? undefined,
      main_camera_mp: specs?.main_camera_mp ?? undefined,
      weight_g: specs?.weight_g ?? undefined,
      ip_rating: specs?.ip_rating ?? undefined,
      has_5g: specs?.has_5g ?? undefined,
      has_anc: specs?.has_anc ?? undefined,
      specs_note: specs?.specs_note ?? "Valeurs indicatives, projet pédagogique",
    },
  };

  return (
    <div>
      <p className="mx-auto mt-6 w-full max-w-[var(--wrap-width)] rounded-card border border-line-soft bg-surface px-5 py-3 text-sm">
        Aperçu administrateur — produit inactif possible, non visible publiquement.
      </p>
      <ProductView product={product} categoryName={category?.name ?? row.category_slug} />
    </div>
  );
}
