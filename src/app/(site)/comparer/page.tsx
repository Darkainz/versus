import { Suspense } from "react";
import { CompareFamilies, type CompareFamily } from "@/components/home/CompareFamilies";
import { CompareCanonicalizer } from "@/components/compare/CompareCanonicalizer";
import { CompareProductPicker } from "@/components/compare/CompareProductPicker";
import { CompareTable } from "@/components/compare/CompareTable";
import { DiffToggle } from "@/components/compare/DiffToggle";
import { getCatalog, getHome, getProduct } from "@/lib/catalog/queries";
import type { CompareGroup } from "@/lib/catalog/types";
import { compareRows } from "@/lib/compare/rows";
import { resolveCompareSelection } from "@/lib/compare/selection";

const groupLabels: Record<CompareGroup, string> = {
  phones: "Smartphones",
  audio: "Écouteurs",
  wearables: "Montres et bracelets",
};

type CompareSearchParams = {
  p?: string | string[];
  diff?: string | string[];
};

function parseCodes(value: string | string[] | undefined) {
  if (!value) return undefined;
  return (Array.isArray(value) ? value : [value])
    .flatMap((part) => part.split(","))
    .filter(Boolean);
}

export default function ComparePage({
  searchParams,
}: {
  searchParams: Promise<CompareSearchParams>;
}) {
  return (
    <Suspense fallback={<CompareLoading />}>
      <CompareContent searchParams={searchParams} />
    </Suspense>
  );
}

function CompareLoading() {
  return (
    <section className="wrap section">
      <h1 className="text-display-h1">Comparer les produits</h1>
      <p role="status" className="mt-4 text-muted">
        Chargement du comparateur…
      </p>
    </section>
  );
}

async function CompareContent({ searchParams }: { searchParams: Promise<CompareSearchParams> }) {
  const params = await searchParams;
  const requestedCodes = parseCodes(params.p);
  const diffValue = Array.isArray(params.diff) ? params.diff[0] : params.diff;
  const diffOnly = diffValue === "1";
  const [catalog, home] = await Promise.all([getCatalog(), getHome()]);
  const selection = resolveCompareSelection(
    requestedCodes,
    catalog,
    home.compare.map(({ product }) => product),
  );

  const homeProducts = new Map(home.compare.map(({ product }) => [product.code, product]));
  const selectedDetails = await Promise.all(
    selection.map(async (product) => {
      const detail = homeProducts.get(product.code) ?? (await getProduct(product.slug));
      if (!detail) throw new Error(`Le produit actif ${product.code} est introuvable.`);
      return detail;
    }),
  );
  const selectedByCode = new Map(selection.map((product) => [product.code, product]));
  const groups = [...new Set(selectedDetails.map(({ compare_group }) => compare_group))];

  const families: CompareFamily[] = groups.map((group) => {
    const groupDetails = selectedDetails.filter((product) => product.compare_group === group);
    const groupSelection = groupDetails.flatMap((product) => {
      const row = selectedByCode.get(product.code);
      return row ? [row] : [];
    });
    return {
      value: group,
      label: groupLabels[group],
      panel: (
        <div className="space-y-5">
          <DiffToggle checked={diffOnly} codes={groupDetails.map(({ code }) => code)} />
          <CompareTable products={groupDetails} rows={compareRows[group]} diffOnly={diffOnly} />
          <CompareProductPicker products={catalog} selected={groupSelection} diffOnly={diffOnly} />
        </div>
      ),
    };
  });

  return (
    <section className="wrap section">
      <CompareCanonicalizer
        requestedCodes={requestedCodes ?? []}
        selectedCodes={selection.map(({ code }) => code)}
      />
      <h1 className="text-display-h1">Comparer les produits</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
        Comparez jusqu’à trois modèles d’une même famille. Les caractéristiques et les prix sont
        indicatifs.
      </p>
      {families.length > 0 ? (
        <div className="mt-8">
          {families.length > 1 ? <CompareFamilies families={families} /> : families[0]?.panel}
        </div>
      ) : (
        <div className="mt-8 rounded-card border border-line-soft bg-bg p-6">
          <p className="text-muted">Aucun produit actif à comparer pour le moment.</p>
          <CompareProductPicker products={catalog} selected={[]} diffOnly={diffOnly} />
        </div>
      )}
    </section>
  );
}
