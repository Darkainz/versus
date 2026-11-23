import { ProductCard, type ProductCardData } from "./ProductCard";

/**
 * « Autres produits Samsung » en bas de la fiche produit (refonte §3.4, lot 5) : jusqu'à 4 cartes
 * de la même marque, en excluant le produit affiché. Les données arrivent du serveur en props.
 */
export function RelatedProducts({
  brandName,
  products,
}: {
  brandName: string;
  products: readonly ProductCardData[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="mt-16" aria-labelledby="related-title">
      <h2 id="related-title" className="text-2xl font-bold tracking-tight">
        Autres produits {brandName}
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.code}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
