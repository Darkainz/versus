import type { ProductDetail } from "@/lib/catalog/types";
import { getQuizBudget, type QuizAnswers, type QuizPhone, type QuizPriority } from "./questions";

export type QuizRecommendation = {
  product: ProductDetail;
  outOfBudget: boolean;
  ideal: boolean;
};

export type QuizScoreResult = {
  recommendations: readonly QuizRecommendation[];
  compatibleCount: number;
  withinBudgetCount: number;
};

function isCompatible(product: ProductDetail, phone: QuizPhone | undefined) {
  return !phone || phone === "none" || product.compat.includes(phone);
}

function priorityValue(product: ProductDetail, priority: QuizPriority | undefined) {
  switch (priority) {
    case "camera":
      return product.specs.main_camera_mp ?? null;
    case "autonomy":
      return product.specs.autonomy_hours ?? null;
    case "storage":
      return product.variants.reduce<number | null>(
        (largest, variant) =>
          variant.storage_gb === null
            ? largest
            : Math.max(largest ?? variant.storage_gb, variant.storage_gb),
        null,
      );
    case "noise-cancellation":
      return product.specs.has_anc === undefined ? null : Number(product.specs.has_anc);
    case "screen":
      return product.specs.screen_size_in ?? null;
    case "price":
    case undefined:
      return product.min_price_fcfa;
  }
}

function ecosystemValue(product: ProductDetail, phone: QuizPhone | undefined) {
  if (!phone || phone === "none") return 0;
  if (phone === "ios") return product.brand_slug === "apple" ? 1 : 0;
  return product.brand_slug === "apple" ? -1 : 1;
}

function compareByFit(
  first: ProductDetail,
  second: ProductDetail,
  answers: QuizAnswers,
  priority: QuizPriority | undefined,
) {
  const ecosystem = ecosystemValue(second, answers.phone) - ecosystemValue(first, answers.phone);
  if (ecosystem !== 0) return ecosystem;

  const firstValue = priorityValue(first, priority);
  const secondValue = priorityValue(second, priority);
  if (firstValue === null && secondValue !== null) return 1;
  if (firstValue !== null && secondValue === null) return -1;
  if (firstValue !== null && secondValue !== null && firstValue !== secondValue) {
    return priority === "price" || priority === undefined
      ? firstValue - secondValue
      : secondValue - firstValue;
  }

  return (
    (first.min_price_fcfa ?? Number.POSITIVE_INFINITY) -
      (second.min_price_fcfa ?? Number.POSITIVE_INFINITY) ||
    second.release_date.localeCompare(first.release_date) ||
    first.code.localeCompare(second.code)
  );
}

function isWithinBudget(price: number | null, budget: { min: number | null; max: number | null }) {
  return (
    price !== null &&
    (budget.min === null || price >= budget.min) &&
    (budget.max === null || price <= budget.max)
  );
}

function distanceFromBudget(
  price: number | null,
  budget: { min: number | null; max: number | null },
) {
  if (price === null) return Number.POSITIVE_INFINITY;
  if (budget.min !== null && price < budget.min) return budget.min - price;
  if (budget.max !== null && price > budget.max) return price - budget.max;
  return 0;
}

function idealFor(product: ProductDetail, answers: QuizAnswers) {
  return !(
    answers.type === "audio" &&
    answers.phone === "android" &&
    product.brand_slug === "apple"
  );
}

export function scoreProducts(
  products: readonly ProductDetail[],
  answers: QuizAnswers,
): QuizScoreResult {
  const budget = getQuizBudget(answers.type, answers.budget);
  if (!budget) throw new Error(`Tranche de budget inconnue : ${answers.budget}`);

  const compatible = products.filter(
    (product) => product.compare_group === answers.type && isCompatible(product, answers.phone),
  );
  const withinBudget = compatible.filter((product) =>
    isWithinBudget(product.min_price_fcfa, budget),
  );
  const priority = answers.priority;
  const sorted = (items: readonly ProductDetail[]) =>
    [...items].sort((a, b) => compareByFit(a, b, answers, priority));

  if (withinBudget.length > 0) {
    return {
      compatibleCount: compatible.length,
      withinBudgetCount: withinBudget.length,
      recommendations: sorted(withinBudget)
        .slice(0, 3)
        .map((product, index) => ({
          product,
          outOfBudget: false,
          ideal: index === 0 && idealFor(product, answers),
        })),
    };
  }

  const closest = compatible
    .toSorted(
      (a, b) =>
        distanceFromBudget(a.min_price_fcfa, budget) -
          distanceFromBudget(b.min_price_fcfa, budget) || compareByFit(a, b, answers, priority),
    )
    .slice(0, 2);

  return {
    compatibleCount: compatible.length,
    withinBudgetCount: 0,
    recommendations: closest.map((product) => ({
      product,
      outOfBudget: true,
      ideal: false,
    })),
  };
}
