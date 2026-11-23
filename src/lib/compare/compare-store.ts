import {
  compareReducer,
  initialCompareState,
  type CompareAction,
  type CompareState,
} from "./compare-reducer";

let snapshot = initialCompareState;
const listeners = new Set<() => void>();

export function getCompareSnapshot() {
  return snapshot;
}

export function subscribeCompare(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function updateCompare(action: CompareAction): CompareState {
  const next = compareReducer(snapshot, action);
  if (next === snapshot) return snapshot;
  snapshot = next;
  for (const listener of listeners) listener();
  return snapshot;
}
