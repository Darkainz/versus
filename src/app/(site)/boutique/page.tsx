import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ShopFilters } from "@/components/catalog/ShopFilters";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { BrandMark } from "@/components/ui/BrandMark";
import { EmptyState } from "@/components/ui/EmptyState";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { brandHref } from "@/config/site";
import { filterCatalog, parseCatalogFilters, type SearchParams } from "@/lib/catalog/filter";
import { getBrands, getCatalog, getCategories } from "@/lib/catalog/queries";
import { isNew } from "@/lib/catalog/is-new";
import { brandNames, productCount } from "@/lib/catalog/summary";
import { getToday } from "@/lib/catalog/today";

export async function generateMetadata(): Promise<Metadata> {
  const [products, brands] = await Promise.all([getCatalog(), getBrands()]);
  return {
    title: "Boutique",
    description: `Les ${productCount(products.length)} ${brandNames(brands)} de la boutique fictive VERSUS.`,
  };
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ShopResults searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, products, categories, brands, today] = await Promise.all([
    searchParams,
    getCatalog(),
    getCategories(),
    getBrands(),
    getToday(),
  ]);
  const { filters, error } = parseCatalogFilters(params);
  const hasFilters =
    ("category" in filters && filters.category !== undefined) ||
    filters.brands.length > 0 ||
    ("minPrice" in filters && filters.minPrice !== undefined) ||
    ("maxPrice" in filters && filters.maxPrice !== undefined) ||
    filters.inStock ||
    filters.sort !== "newest";
  const visibleProducts = filterCatalog(products, filters);

  return (
    <div className="wrap py-14 sm:py-20">
      <Eyebrow>La boutique</Eyebrow>
      <h1 className="mt-3 text-display-h2">Les produits VERSUS.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        {productCount(products.length)} pour découvrir les univers {brandNames(brands)}. Prix
        indicatifs en FCFA, projet pédagogique sans vente réelle.
      </p>
      <nav aria-label="Marques" className="mt-6">
        <ul className="flex flex-wrap items-center gap-x-5">
          {brands.map((brand) => {
            const href = brandHref(brand.slug);
            return href ? (
              <li key={brand.slug}>
                <BrandMark brand={brand.slug} size="lead" href={href} />
              </li>
            ) : null;
          })}
        </ul>
      </nav>
      <div className="mt-8">
        <ShopFilters categories={categories} brands={brands} filters={filters} />
      </div>
      {error ? (
        <p role="alert" className="mt-5 rounded-option bg-accent-soft p-4 text-sm text-ink">
          {error}
        </p>
      ) : null}
      <p aria-live="polite" className="mt-8 text-sm text-muted">
        {visibleProducts.length} produit{visibleProducts.length === 1 ? "" : "s"}
      </p>
      {visibleProducts.length ? (
        hasFilters ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProducts.map((product) => (
              <li key={product.code}>
                <ProductCard product={{ ...product, is_new: isNew(product, today) }} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 space-y-14">
            {categories.map((category) => {
              const items = visibleProducts.filter(
                (product) => product.category_slug === category.slug,
              );
              if (!items.length) return null;
              return (
                <section
                  key={category.slug}
                  id={category.slug}
                  aria-labelledby={`${category.slug}-title`}
                >
                  <div className="mb-6">
                    <h2
                      id={`${category.slug}-title`}
                      className="text-3xl font-extrabold tracking-tight"
                    >
                      {category.name}
                    </h2>
                    <p className="mt-2 text-muted">{category.intro}</p>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((product) => (
                      <li key={product.code}>
                        <ProductCard product={{ ...product, is_new: isNew(product, today) }} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )
      ) : (
        <div className="mt-5">
          <EmptyState title="Aucun produit ne correspond à ces filtres.">
            Modifiez vos critères ou{" "}
            <Link
              className="font-semibold text-accent underline underline-offset-4"
              href="/boutique"
            >
              effacez les filtres
            </Link>
            .
          </EmptyState>
        </div>
      )}
    </div>
  );
}
