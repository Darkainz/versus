"use client";

import { lazy, Suspense } from "react";
import { useCompare } from "@/lib/compare/use-compare";

const CompareTray = lazy(() =>
  import("./CompareTray").then((module) => ({ default: module.CompareTray })),
);

export function CompareTrayLoader() {
  const state = useCompare();
  if (state.products.length === 0 && !state.notice && !state.pendingProduct) return null;

  return (
    <Suspense fallback={null}>
      <CompareTray />
    </Suspense>
  );
}
