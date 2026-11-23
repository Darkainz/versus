import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { routeFor } from "@/config/site";
import { getCatalog, getCategories } from "@/lib/catalog/queries";
import { isNew } from "@/lib/catalog/is-new";
import { getToday } from "@/lib/catalog/today";

type CategoryParams = { categorie: string };

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map(({ slug }) => ({ categorie: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CategoryParams>;
}): Promise<Metadata> {
  const { categorie } = await params;
  const category = (await getCategories()).find(({ slug }) => slug === categorie);
  if (!category) return {};
  return {
    title: category.name,
    description: `${category.intro} Prix indicatifs en FCFA, projet pédagogique.`,
  };
}

export default function CategoryPage({
  params,
}: {
  params: Promise<CategoryParams>;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CategoryResults params={params} />
    </Suspense>
  );
}

async function CategoryResults({ params }: { params: Promise<CategoryParams> }) {
  const [{ categorie }, categories, products, today] = await Promise.all([
    params,
    getCategories(),
    getCatalog(),
    getToday(),
  ]);
  const category = categories.find(({ slug }) => slug === categorie);
  if (!category) notFound();

  const items = products.filter((product) => product.category_slug === category.slug);
  return (
    <div className="wrap py-14 sm:py-20">
      <Breadcrumb
        items={[
          { label: "Boutique", href: routeFor("boutique") },
          { label: category.name },
        ]}
      />
      <Eyebrow className="mt-8">{category.name}</Eyebrow>
      <h1 className="mt-3 text-display-h2">{category.name} VERSUS</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">{category.intro}</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <li key={product.code}>
            <ProductCard product={{ ...product, is_new: isNew(product, today) }} />
          </li>
        ))}
      </ul>
    </div>
  );
}
