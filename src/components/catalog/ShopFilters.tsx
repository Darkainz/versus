import Link from "next/link";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import type { CatalogBrand, CatalogCategory } from "@/lib/catalog/types";
import type { CatalogFilters } from "@/lib/catalog/filter";

type ShopFiltersProps = {
  categories: readonly CatalogCategory[];
  brands: readonly CatalogBrand[];
  filters: CatalogFilters;
};

export function ShopFilters({ categories, brands, filters }: ShopFiltersProps) {
  return (
    <form
      action="/boutique"
      method="get"
      aria-label="Filtres du catalogue"
      className="grid gap-6 rounded-tile border border-line-soft bg-surface p-5 md:grid-cols-2 lg:grid-cols-4"
    >
      <Select
        id="filter-category"
        name="category"
        label="Catégorie"
        defaultValue={filters.category}
      >
        <option value="">Toutes les catégories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </Select>

      <fieldset className="grid content-start gap-1">
        <legend className="mb-1 text-sm font-medium">Marques</legend>
        {brands.map((brand) => (
          <Checkbox
            key={brand.slug}
            name="brand"
            value={brand.slug}
            label={brand.name}
            defaultChecked={filters.brands.includes(brand.slug)}
          />
        ))}
      </fieldset>

      <fieldset className="grid content-start gap-3">
        <legend className="text-sm font-medium">Prix indicatif (FCFA)</legend>
        <label className="grid gap-1 text-sm text-muted">
          Minimum
          <input
            name="minPrice"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={filters.minPrice}
            className="min-h-11 rounded-option border border-line bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </label>
        <label className="grid gap-1 text-sm text-muted">
          Maximum
          <input
            name="maxPrice"
            type="number"
            min="0"
            inputMode="numeric"
            defaultValue={filters.maxPrice}
            className="min-h-11 rounded-option border border-line bg-surface px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </label>
      </fieldset>

      <div className="grid content-start gap-3">
        <Select id="filter-sort" name="sort" label="Trier par" defaultValue={filters.sort}>
          <option value="newest">Nouveautés</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </Select>
        <Checkbox
          name="inStock"
          value="1"
          label="Disponibles uniquement"
          defaultChecked={filters.inStock}
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
          >
            Appliquer
          </button>
          <Link
            href="/boutique"
            className="inline-flex min-h-11 items-center rounded-full border border-line px-5 text-sm font-semibold state-hover:border-ink"
          >
            Effacer
          </Link>
        </div>
      </div>
    </form>
  );
}
