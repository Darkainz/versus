import { siteUrl } from "@/lib/env";

const DEFAULT_REDIRECT = "/compte";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const DANGEROUS_ENCODING = /%(?:5c|2f|09|0a|0d)/i;

function isUnsafe(value: string): boolean {
  if (value.includes("\\") || CONTROL_CHARACTERS.test(value) || DANGEROUS_ENCODING.test(value)) {
    return true;
  }

  try {
    const decoded = decodeURIComponent(value);
    return (
      decoded.includes("\\") || CONTROL_CHARACTERS.test(decoded) || DANGEROUS_ENCODING.test(decoded)
    );
  } catch {
    return true;
  }
}

export function safeRedirect(
  value: string | null | undefined,
  fallback = DEFAULT_REDIRECT,
): string {
  if (!value || isUnsafe(value)) return fallback;

  try {
    const target = new URL(value, siteUrl);
    if (target.origin !== new URL(siteUrl).origin) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
