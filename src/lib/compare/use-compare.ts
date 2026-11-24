"use client";

import { useSyncExternalStore } from "react";
import { getCompareSnapshot, subscribeCompare } from "./compare-store";
import { initialCompareState } from "./compare-reducer";

const serverSnapshot = () => initialCompareState;

export function useCompare() {
  return useSyncExternalStore(subscribeCompare, getCompareSnapshot, serverSnapshot);
}
