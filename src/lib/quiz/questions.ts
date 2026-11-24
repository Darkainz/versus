import type { CompareGroup } from "@/lib/catalog/types";

export const quizTypes = [
  { value: "phones", label: "Un smartphone" },
  { value: "audio", label: "Des écouteurs" },
  { value: "wearables", label: "Une montre ou un bracelet" },
] as const satisfies readonly { value: CompareGroup; label: string }[];

export const quizBudgets = {
  phones: [
    { value: "under-300", label: "Moins de 300 000 FCFA", min: null, max: 299_999 },
    { value: "300-500", label: "De 300 000 à 500 000 FCFA", min: 300_000, max: 500_000 },
    { value: "over-500", label: "Plus de 500 000 FCFA", min: 500_001, max: null },
  ],
  audio: [
    { value: "under-100", label: "Moins de 100 000 FCFA", min: null, max: 99_999 },
    { value: "over-100", label: "100 000 FCFA ou plus", min: 100_000, max: null },
  ],
  wearables: [
    { value: "under-50", label: "Moins de 50 000 FCFA", min: null, max: 49_999 },
    { value: "50-150", label: "De 50 000 à 150 000 FCFA", min: 50_000, max: 150_000 },
    { value: "over-150", label: "Plus de 150 000 FCFA", min: 150_001, max: null },
  ],
} as const satisfies Record<
  CompareGroup,
  readonly { value: string; label: string; min: number | null; max: number | null }[]
>;

export const quizPriorities = {
  phones: [
    { value: "camera", label: "La photo" },
    { value: "autonomy", label: "L’autonomie" },
    { value: "storage", label: "Le stockage" },
  ],
  audio: [
    { value: "noise-cancellation", label: "La réduction de bruit" },
    { value: "autonomy", label: "L’autonomie" },
    { value: "price", label: "Le prix le plus bas" },
  ],
  wearables: [
    { value: "autonomy", label: "L’autonomie" },
    { value: "screen", label: "L’écran" },
    { value: "price", label: "Le prix le plus bas" },
  ],
} as const satisfies Record<CompareGroup, readonly { value: string; label: string }[]>;

export const quizPhones = [
  { value: "ios", label: "Un iPhone (iOS)" },
  { value: "android", label: "Un téléphone Android" },
  { value: "none", label: "Je n’ai pas de téléphone" },
] as const;

export type QuizType = (typeof quizTypes)[number]["value"];
export type QuizBudget = (typeof quizBudgets)[QuizType][number]["value"];
export type QuizPriority = (typeof quizPriorities)[QuizType][number]["value"];
export type QuizPhone = (typeof quizPhones)[number]["value"];

export type QuizAnswers = {
  type: QuizType;
  budget: QuizBudget;
  phone?: QuizPhone;
  priority?: QuizPriority;
};

export function isQuizType(value: string | undefined): value is QuizType {
  return quizTypes.some((option) => option.value === value);
}

export function getQuizBudget(type: QuizType, value: string | undefined) {
  return quizBudgets[type].find((option) => option.value === value);
}

export function getQuizPriority(type: QuizType, value: string | undefined) {
  return quizPriorities[type].find((option) => option.value === value);
}

export function isQuizPhone(value: string | undefined): value is QuizPhone {
  return quizPhones.some((option) => option.value === value);
}
