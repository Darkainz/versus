import type { CatalogProductRow, CompareGroup } from "@/lib/catalog/types";

export type CompareProduct = Pick<CatalogProductRow, "code" | "name" | "compare_group">;

export type CompareState = {
  products: readonly CompareProduct[];
  activeGroup: CompareGroup | null;
  pendingProduct: CompareProduct | null;
  notice: string | null;
};

export type CompareAction =
  | { type: "add"; product: CompareProduct }
  | { type: "remove"; code: string }
  | { type: "clear" }
  | { type: "confirmReplacement" }
  | { type: "cancelReplacement" }
  | { type: "dismissNotice" };

export const initialCompareState: CompareState = {
  products: [],
  activeGroup: null,
  pendingProduct: null,
  notice: null,
};

export function compareReducer(state: CompareState, action: CompareAction): CompareState {
  switch (action.type) {
    case "add": {
      if (state.pendingProduct || state.products.some(({ code }) => code === action.product.code)) {
        return state;
      }

      const currentGroup = state.products[0]?.compare_group;
      if (currentGroup && currentGroup !== action.product.compare_group) {
        return { ...state, pendingProduct: action.product, notice: null };
      }

      if (state.products.length < 3) {
        return {
          ...state,
          products: [...state.products, action.product],
          activeGroup: action.product.compare_group,
          notice: null,
        };
      }

      const [removed, ...remaining] = state.products;
      if (!removed) return state;
      return {
        ...state,
        products: [...remaining, action.product],
        activeGroup: action.product.compare_group,
        notice: `${removed.name} a été retiré du comparateur (3 produits maximum).`,
      };
    }

    case "remove":
      return state.products.some(({ code }) => code === action.code)
        ? { ...state, products: state.products.filter(({ code }) => code !== action.code) }
        : state;

    case "clear":
      return {
        ...state,
        products: [],
        pendingProduct: null,
        notice: null,
      };

    case "confirmReplacement":
      return state.pendingProduct
        ? {
            products: [state.pendingProduct],
            activeGroup: state.pendingProduct.compare_group,
            pendingProduct: null,
            notice: null,
          }
        : state;

    case "cancelReplacement":
      return state.pendingProduct ? { ...state, pendingProduct: null } : state;

    case "dismissNotice":
      return state.notice ? { ...state, notice: null } : state;
  }
}
