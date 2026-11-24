import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/product/ProductView";
import { getCatalog, getCategories, getProduct } from "@/lib/catalog/queries";
import { isNew } from "@/lib/catalog/is-new";
import { getToday } from "@/lib/catalog/today";

/**
 * Fiche produit entièrement statique (§3.2). Avec Cache Components, un slug absent de
 * `generateStaticParams` recevrait sinon la coquille prérendue (HTTP 200) avant que `notFound()`
 * ne s'exécute : `'navigation'` fait attendre la page complète à la première requête, donc un
 * produit inconnu répond 404 dès la première visite (guide ensureStatic de Next 16).
 */
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  return (await getCatalog()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produit/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product
    ? {
        title: product.name,
        description: `${product.tagline} Prix indicatif en FCFA. Projet pédagogique, aucune vente réelle.`,
      }
    : {};
}

export default async function ProductPage({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  const [product, catalog, categories] = await Promise.all([
    getProduct(slug),
    getCatalog(),
    getCategories(),
  ]);
  if (!product) notFound();
  const category = categories.find((item) => item.slug === product.category_slug);
  const today = await getToday();

  // Autres produits de la même marque (refonte §3.4, lot 5) : 4 au plus, hors produit affiché.
  const relatedProducts = catalog
    .filter((p) => p.brand_slug === product.brand_slug && p.slug !== product.slug)
    .slice(0, 4)
    .map((p) => ({ ...p, is_new: isNew(p, today) }));

  return (
    <ProductView
      product={product}
      categoryName={category?.name ?? product.category_slug}
      relatedProducts={relatedProducts}
    />
  );
}
