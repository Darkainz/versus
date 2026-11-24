/** Retourne un numéro togolais normalisé ou `null` si sa forme n'est pas reconnue. */
export function normalizeTogoPhone(value: string): string | null {
  const compact = value.replace(/[\s().-]/g, "");
  const national = compact.startsWith("+228") ? compact.slice(4) : compact;
  return /^[0-9]{8}$/.test(national) ? `+228${national}` : null;
}
