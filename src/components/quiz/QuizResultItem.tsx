import { ProductVisual } from "@/components/product/ProductVisual";
import { Price } from "@/components/ui/Price";
import { productHref } from "@/config/site";
import type { QuizRecommendation } from "@/lib/quiz/score";

export function QuizResultItem({
  recommendation,
  category,
}: {
  recommendation: QuizRecommendation;
  category?: string;
}) {
  const { product, ideal, outOfBudget } = recommendation;

  return (
    <li data-quiz-product={product.code} className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-accent">
        {outOfBudget ? "Alternative hors budget" : ideal ? "Meilleur choix" : "Option recommandée"}
      </p>
      <article className="flex h-full min-h-[420px] flex-col rounded-card bg-brand-ground p-6">
        <p className="text-meta text-brand-ink">{product.brand_name}</p>
        <ProductVisual
          product={product}
          decorative
          sizes="(max-width: 640px) 55vw, (max-width: 1024px) 35vw, 260px"
          className="mt-3.5 mb-1.5 flex h-[200px] w-full items-center justify-center"
        />
        <h3 className="mt-2 mb-1.5 font-display text-[21px] leading-[1.15] font-bold">
          <a href={productHref(product.slug)}>{product.name}</a>
        </h3>
        {category ? <p className="text-sm text-muted-strong">{category}</p> : null}
        <p className="mt-2 flex-1 text-[14.5px] leading-[1.45] text-muted-strong">
          {product.tagline}
        </p>
        <p className="mt-3.5 mb-3 text-[15px] font-semibold">
          {product.min_price_fcfa !== null ? (
            <Price
              amount={[product.min_price_fcfa, product.max_price_fcfa ?? product.min_price_fcfa]}
              size="card"
            />
          ) : (
            "Prix indisponible"
          )}
        </p>
      </article>
    </li>
  );
}
