import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/catalog/ProductGridSkeleton";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCatalog } from "@/lib/catalog/queries";
import { searchCatalog } from "@/lib/catalog/search";
import { isNew } from "@/lib/catalog/is-new";
import { getToday } from "@/lib/catalog/today";
import type { SearchParams } from "@/lib/catalog/filter";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Recherchez dans le catalogue fictif VERSUS.",
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, products, today] = await Promise.all([searchParams, getCatalog(), getToday()]);
  const query = params.q;
  const invalidQuery = Array.isArray(query) || (typeof query === "string" && query.length > 100);
  const value = typeof query === "string" && !invalidQuery ? query.trim() : "";
  const results = value ? searchCatalog(products, value) : [];

  return (
    <div className="wrap py-14 sm:py-20">
      <Eyebrow>Recherche</Eyebrow>
      <h1 className="mt-3 text-display-h2">Que cherchez-vous ?</h1>
      <form
        action="/recherche"
        method="get"
        className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="search-query" className="sr-only">
          Nom de produit, marque ou catégorie
        </label>
        <input
          id="search-query"
          name="q"
          type="search"
          maxLength={100}
          defaultValue={value}
          placeholder="Ex. Redmi, écouteurs, montre…"
          className="min-h-12 flex-1 rounded-full border border-line bg-surface px-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          className="min-h-12 rounded-full bg-accent px-7 font-semibold text-on-accent"
        >
          Rechercher
        </button>
      </form>
      {invalidQuery ? (
        <p role="alert" className="mt-4 text-sm text-danger">
          La recherche doit contenir au plus 100 caractères et une seule valeur.
        </p>
      ) : null}
      {value ? (
        <>
          <p aria-live="polite" className="mt-8 text-sm text-muted">
            {results.length} résultat{results.length === 1 ? "" : "s"} pour « {value} »
          </p>
          {results.length ? (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((product) => (
                <li key={product.code}>
                  <ProductCard product={{ ...product, is_new: isNew(product, today) }} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState title="Aucun résultat.">
                Essayez un nom de marque, une catégorie ou un autre mot-clé.
              </EmptyState>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8">
          <EmptyState title="Recherchez le catalogue.">
            Saisissez un produit, une marque ou une catégorie. Les accents ne sont pas nécessaires.
          </EmptyState>
        </div>
      )}
    </div>
  );
}
