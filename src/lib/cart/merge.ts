import { maxQuantityPerLine } from "@/config/cart-limits";
import type { CartLine } from "./cart-reducer";
import { isCartSku } from "./sku";

export const MAX_ACCOUNT_CART_LINES = 20;

export type CartMergeResult = {
  lines: CartLine[];
  overflow: boolean;
};

export function parseAccountCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];

  const parsed: CartLine[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const item = entry as Record<string, unknown>;
    if (
      !isCartSku(item.sku) ||
      typeof item.qty !== "number" ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      seen.has(item.sku)
    ) {
      continue;
    }
    seen.add(item.sku);
    parsed.push({ sku: item.sku, qty: Math.min(item.qty, maxQuantityPerLine) });
  }
  return parsed.slice(0, MAX_ACCOUNT_CART_LINES);
}

export function mergeCartLines(
  localLines: readonly CartLine[],
  accountItems: unknown,
): CartMergeResult {
  const merged = new Map<string, number>();
  let overflow = false;
  for (const line of [...parseAccountCart(accountItems), ...localLines]) {
    if (!isCartSku(line.sku) || !Number.isInteger(line.qty) || line.qty < 1) continue;
    if (!merged.has(line.sku) && merged.size >= MAX_ACCOUNT_CART_LINES) {
      overflow = true;
      continue;
    }
    merged.set(
      line.sku,
      Math.max(merged.get(line.sku) ?? 0, Math.min(line.qty, maxQuantityPerLine)),
    );
  }
  return { lines: Array.from(merged, ([sku, qty]) => ({ sku, qty })), overflow };
}
