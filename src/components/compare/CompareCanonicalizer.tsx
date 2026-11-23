"use client";

import { useEffect } from "react";

export function CompareCanonicalizer({
  requestedCodes,
  selectedCodes,
}: {
  requestedCodes: readonly string[];
  selectedCodes: readonly string[];
}) {
  const requestedKey = requestedCodes.join(",");
  const selectedKey = selectedCodes.join(",");

  useEffect(() => {
    if (requestedCodes.length !== 1 || selectedCodes.length <= 1) return;
    const url = new URL(window.location.href);
    url.searchParams.set("p", selectedKey);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [requestedCodes.length, requestedKey, selectedCodes.length, selectedKey]);

  return null;
}
