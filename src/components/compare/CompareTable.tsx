import type { CSSProperties } from "react";
import { ProductVisual } from "@/components/product/ProductVisual";
import { Price } from "@/components/ui/Price";
import { productHref } from "@/config/site";
import { brandThemes } from "@/lib/brand-themes";
import type { ProductDetail } from "@/lib/catalog/types";
import type { CompareRow } from "@/lib/compare/rows";

function fullName(product: ProductDetail) {
  return product.name.startsWith(product.brand_name)
    ? product.name
    : `${product.brand_name} ${product.name}`;
}

function bestScore(row: CompareRow, products: readonly ProductDetail[]) {
  if (!row.score || !row.better) return null;
  const scores = products.flatMap((product) => {
    const value = row.score?.(product);
    return value === null || value === undefined ? [] : [value];
  });
  if (scores.length === 0) return null;
  return row.better === "higher" ? Math.max(...scores) : Math.min(...scores);
}

export function CompareTable({
  products,
  rows,
  diffOnly = false,
}: {
  products: readonly ProductDetail[];
  rows: readonly CompareRow[];
  diffOnly?: boolean;
}) {
  const visibleRows = rows.filter((row) => {
    if (!diffOnly) return true;
    return new Set(products.map((product) => row.format(product) ?? "—")).size > 1;
  });

  return (
    <div
      role="region"
      aria-label={`Comparaison : ${products.map(fullName).join(", ")}`}
      tabIndex={0}
      className="compare-box zoom"
    >
      <table className="compare-table">
        <caption className="sr-only">
          Comparaison de {products.map(fullName).join(", ")} : valeurs indicatives
        </caption>
        <thead>
          <tr>
            <th scope="col" className="compare-row-label">
              <span aria-hidden="true">Modèle</span>
              <span className="sr-only">Caractéristique</span>
            </th>
            {products.map((product) => (
              <th
                scope="col"
                key={product.code}
                className="compare-product"
                aria-label={fullName(product)}
                style={{ "--compare-brand": brandThemes[product.brand_slug].ink } as CSSProperties}
              >
                <ProductVisual product={product} decorative sizes="150px" className="compare-art" />
                <span className="compare-brand">{product.brand_name}</span>
                <span className="compare-name">{product.name}</span>
                <a className="compare-link" href={productHref(product.slug)}>
                  Voir le produit<span className="sr-only"> {product.name}</span>
                </a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const best = bestScore(row, products);
            return (
              <tr key={row.key}>
                <th scope="row" className="compare-row-label">
                  {row.label}
                </th>
                {products.map((product) => {
                  const score = row.score?.(product);
                  const isBest =
                    best !== null && score !== null && score !== undefined && score === best;
                  return (
                    <td
                      key={product.code}
                      data-product-label={fullName(product)}
                      className={row.key === "price" ? "compare-price" : undefined}
                    >
                      <span className="compare-value">
                        {row.key === "price" && product.min_price_fcfa !== null ? (
                          <Price
                            amount={[
                              product.min_price_fcfa,
                              product.max_price_fcfa ?? product.min_price_fcfa,
                            ]}
                          />
                        ) : (
                          (row.format(product) ?? "—")
                        )}
                        {isBest ? (
                          <span className="mt-1 block text-xs font-semibold text-accent-ink">
                            Meilleure valeur
                          </span>
                        ) : null}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul role="list" className="compare-mobile-links">
        {products.map((product) => (
          <li key={product.code}>
            <a className="compare-link" href={productHref(product.slug)}>
              <span>
                Voir le produit <strong className="compare-link-name">{product.name}</strong>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {visibleRows.length === 0 ? (
        <p className="p-5 text-muted">Aucune différence sur les caractéristiques affichées.</p>
      ) : null}
    </div>
  );
}
