import type { Metadata } from "next";
import { QuizResultItem } from "@/components/quiz/QuizResultItem";
import { buttonClasses } from "@/components/ui/button-styles";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { routeFor } from "@/config/site";
import { getCatalog, getCategories, getProduct } from "@/lib/catalog/queries";
import {
  getQuizBudget,
  getQuizPriority,
  isQuizPhone,
  isQuizType,
  quizBudgets,
  quizPhones,
  quizPriorities,
  quizTypes,
  type QuizAnswers,
} from "@/lib/quiz/questions";
import { scoreProducts } from "@/lib/quiz/score";

export const metadata: Metadata = {
  title: "Aide au choix",
  description:
    "Répondez à quelques questions pour trouver les smartphones, écouteurs ou montres les mieux adaptés. Projet pédagogique, aucune vente réelle.",
};

// Wait for GET parameters so clients without JavaScript receive the complete form and results.
export const instant = false;

type QuizSearchParams = Record<string, string | string[] | undefined>;

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<QuizSearchParams>;
}) {
  return <QuizContent params={await searchParams} />;
}

async function QuizContent({ params }: { params: QuizSearchParams }) {
  const typeValue = typeof params.type === "string" ? params.type : undefined;
  const type = isQuizType(typeValue) ? typeValue : undefined;
  const action = routeFor("aideAuChoix");
  if (!action) throw new Error("La route de l’aide au choix doit être livrée.");

  const hasSubmittedAnswers = ["budget", "tel", "prio"].some((key) => params[key] !== undefined);
  const hasRepeatedValues = ["type", "budget", "tel", "prio"].some((key) =>
    Array.isArray(params[key]),
  );
  const budgetValue = typeof params.budget === "string" ? params.budget : undefined;
  const phoneValue = typeof params.tel === "string" ? params.tel : undefined;
  const priorityValue = typeof params.prio === "string" ? params.prio : undefined;
  const budget = type ? getQuizBudget(type, budgetValue) : undefined;
  const priority = type ? getQuizPriority(type, priorityValue) : undefined;
  const needsPhone = type === "audio" || type === "wearables";
  const phone = needsPhone && isQuizPhone(phoneValue) ? phoneValue : undefined;
  const invalidQuery =
    (params.type !== undefined && !type) ||
    (hasSubmittedAnswers &&
      (hasRepeatedValues ||
        !type ||
        !budget ||
        !priority ||
        (needsPhone && !phone) ||
        (!needsPhone && params.tel !== undefined)));

  let quizResult:
    | {
        recommendations: ReturnType<typeof scoreProducts>;
        categoryNames: Map<string, string>;
      }
    | undefined;
  if (hasSubmittedAnswers && !invalidQuery && type && budget && priority) {
    const answers: QuizAnswers = {
      type,
      budget: budget.value,
      priority: priority.value,
      ...(phone ? { phone } : {}),
    };
    const [catalog, categories] = await Promise.all([getCatalog(), getCategories()]);
    const categoryNames = new Map(categories.map(({ slug, name }) => [slug, name]));
    const candidates = catalog.filter((product) => product.compare_group === type);
    const details = await Promise.all(
      candidates.map(async (candidate) => {
        const detail = await getProduct(candidate.slug);
        if (!detail) throw new Error(`Le produit actif ${candidate.code} est introuvable.`);
        return detail;
      }),
    );
    quizResult = {
      recommendations: scoreProducts(details, answers),
      categoryNames,
    };
  }

  const compareHref = routeFor("comparer");
  const compareUrl =
    compareHref && quizResult?.recommendations.recommendations.length
      ? `${compareHref}?p=${encodeURIComponent(
          quizResult.recommendations.recommendations.map(({ product }) => product.code).join(","),
        )}`
      : null;

  return (
    <section className="wrap section">
      <Eyebrow>Aide au choix</Eyebrow>
      <h1 className="text-display-h1 mt-3">Trouvons le modèle qui vous convient</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">
        Quelques réponses suffisent pour obtenir des recommandations adaptées à votre budget et à
        vos priorités. Les prix sont indicatifs ; aucune vente réelle n’est effectuée.
      </p>

      {!type ? (
        <form
          action={action}
          method="get"
          className="mt-8 max-w-2xl rounded-card border border-line-soft bg-surface p-6 sm:p-8"
        >
          <fieldset>
            <legend className="text-xl font-semibold">Que recherchez-vous ?</legend>
            <div className="mt-4 grid gap-3">
              {quizTypes.map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-option border border-line px-5 has-checked:border-accent"
                >
                  <input type="radio" name="type" value={option.value} required />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {invalidQuery ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              Choisissez un type de produit valide pour commencer.
            </p>
          ) : null}
          <button type="submit" className={buttonClasses({ className: "mt-6" })}>
            Continuer
          </button>
        </form>
      ) : (
        <form
          action={action}
          method="get"
          className="mt-8 max-w-3xl space-y-7 rounded-card border border-line-soft bg-surface p-6 sm:p-8"
        >
          <input type="hidden" name="type" value={type} />
          <fieldset>
            <legend className="text-xl font-semibold">
              Quel budget souhaitez-vous consacrer ?
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quizBudgets[type].map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-option border border-line px-5 has-checked:border-accent"
                >
                  <input
                    type="radio"
                    name="budget"
                    value={option.value}
                    defaultChecked={budgetValue === option.value}
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {needsPhone ? (
            <fieldset>
              <legend className="text-xl font-semibold">Quel téléphone utilisez-vous ?</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {quizPhones.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-14 cursor-pointer items-center gap-3 rounded-option border border-line px-5 has-checked:border-accent"
                  >
                    <input
                      type="radio"
                      name="tel"
                      value={option.value}
                      defaultChecked={phoneValue === option.value}
                      required
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

          <fieldset>
            <legend className="text-xl font-semibold">
              Qu’est-ce qui compte le plus pour vous ?
            </legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {quizPriorities[type].map((option) => (
                <label
                  key={option.value}
                  className="flex min-h-14 cursor-pointer items-center gap-3 rounded-option border border-line px-5 has-checked:border-accent"
                >
                  <input
                    type="radio"
                    name="prio"
                    value={option.value}
                    defaultChecked={priorityValue === option.value}
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          {invalidQuery ? (
            <p role="alert" className="text-sm text-danger">
              Certaines réponses sont manquantes ou invalides. Vérifiez vos choix et réessayez.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className={buttonClasses()}>
              Voir mes recommandations
            </button>
            <a
              href={action}
              className="text-sm font-semibold text-accent underline underline-offset-4"
            >
              Recommencer
            </a>
          </div>
        </form>
      )}

      {quizResult ? (
        <section id="recommandations" aria-labelledby="recommandations-titre" className="mt-12">
          <h2 id="recommandations-titre" className="text-display-h2">
            Vos recommandations
          </h2>
          {quizResult.recommendations.withinBudgetCount === 0 &&
          quizResult.recommendations.recommendations.length > 0 ? (
            <p role="status" className="mt-4 rounded-card bg-surface p-5 text-muted">
              Aucun modèle de cette famille n’entre dans cette tranche de budget. Voici les
              alternatives les plus proches, signalées comme hors budget.
            </p>
          ) : null}
          {quizResult.recommendations.recommendations.length ? (
            <>
              <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quizResult.recommendations.recommendations.map((recommendation) => (
                  <QuizResultItem
                    key={recommendation.product.code}
                    recommendation={recommendation}
                    category={quizResult.categoryNames.get(recommendation.product.category_slug)}
                  />
                ))}
              </ul>
              {compareUrl ? (
                <p className="mt-7">
                  <a
                    href={compareUrl}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-7 font-semibold text-on-accent"
                  >
                    Comparer ces modèles
                  </a>
                </p>
              ) : null}
            </>
          ) : (
            <p role="status" className="mt-4 text-muted">
              Aucun produit compatible n’est disponible dans le catalogue actif pour le moment.
            </p>
          )}
        </section>
      ) : null}
    </section>
  );
}
