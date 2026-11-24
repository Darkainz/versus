import type { Brand } from "@/lib/brand-themes";

/**
 * Origine des visuels de `public/products` (un par produit, nommé `<code>.png`), reprise de
 * `public/products/SOURCES.md` pour la page /credits. Le test du catalogue vérifie que chaque
 * produit a sa ligne ici et dans SOURCES.md.
 */
export type ProductVisualSource = {
  code: string;
  /** Produit et coloris montrés. */
  label: string;
  brand: Brand;
  /** Site officiel d'où vient le visuel. */
  site: "apple.com" | "samsung.com" | "mi.com" | "fourni par le projet";
  /** Date de téléchargement (AAAA-MM-JJ). */
  downloaded: string;
};

const apple = (code: string, label: string, downloaded = "2026-11-17") =>
  ({ code, label, brand: "apple", site: "apple.com", downloaded }) as const;
/** Visuel Apple remis par l'auteur du projet (origine exacte non vérifiée, voir SOURCES.md). */
const fourni = (code: string, label: string) =>
  ({
    code,
    label,
    brand: "apple",
    site: "fourni par le projet",
    downloaded: "2026-11-24",
  }) as const;
const samsung = (code: string, label: string, downloaded = "2026-11-17") =>
  ({ code, label, brand: "samsung", site: "samsung.com", downloaded }) as const;
const xiaomi = (code: string, label: string, downloaded = "2026-11-17") =>
  ({ code, label, brand: "xiaomi", site: "mi.com", downloaded }) as const;

export const productVisualSources: readonly ProductVisualSource[] = [
  apple("ipd", "iPhone Duo (blanc stellaire)"),
  apple("ip18", "iPhone 18 Pro (bordeaux)", "2026-11-12"),
  apple("ip17", "iPhone 17 (lavande)"),
  apple("ip17e", "iPhone 17e (rose pastel)"),
  apple("apm2", "AirPods Max 2 (minuit)"),
  apple("app3", "AirPods Pro 3"),
  apple("ap5", "AirPods 5", "2026-11-12"),
  apple("awu4", "Apple Watch Ultra 4 (titane naturel)"),
  apple("aw12", "Apple Watch Series 12 (bronze sombre, bracelet sport kaki)"),
  apple("awse3", "Apple Watch SE 3 (lumière stellaire)"),
  samsung("zf8", "Galaxy Z Fold8 (lavande)"),
  samsung("s26u", "Galaxy S26 Ultra (violet)"),
  samsung("zfl8", "Galaxy Z Flip8 (rose)"),
  samsung("s26", "Galaxy S26 (violet)"),
  samsung("a57", "Galaxy A57 5G (bleu clair)", "2026-11-12"),
  samsung("gb4p", "Galaxy Buds4 Pro (noir)"),
  samsung("gb4", "Galaxy Buds4 (blanc)", "2026-11-12"),
  samsung("gwu2", "Galaxy Watch Ultra2 (argent titane)"),
  samsung("gw9", "Galaxy Watch9 (graphite)", "2026-11-12"),
  samsung("gf3", "Galaxy Fit3 (gris)"),
  xiaomi("x17u", "Xiaomi 17 Ultra (noir)"),
  xiaomi("x17", "Xiaomi 17 (noir)"),
  xiaomi("x17tp", "Xiaomi 17T Pro (bleu)"),
  xiaomi("rn15", "Redmi Note 15 Pro+ 5G (noir et moka)", "2026-11-12"),
  xiaomi("xb6", "Xiaomi Buds 6 (violet nébuleux)"),
  xiaomi("rb8", "Redmi Buds 8 (noir)"),
  xiaomi("xws5", "Xiaomi Watch S5 46 mm (noir)"),
  xiaomi("rw6", "Redmi Watch 6 (noir)", "2026-11-12"),
  xiaomi("sb10p", "Xiaomi Smart Band 10 Pro (noir)"),
  xiaomi("sb10", "Xiaomi Smart Band 10 (gris)", "2026-11-12"),
  apple("iphone16pro", "iPhone 16 Pro (titane désert)", "2026-11-23"),
  apple("i16pmax", "iPhone 16 Pro Max (titane désert)", "2026-11-23"),
  apple("iphone16", "iPhone 16 (outremer)", "2026-11-23"),
  apple("iphone16plus", "iPhone 16 Plus (outremer)", "2026-11-23"),
  apple("iphone15pro", "iPhone 15 Pro (titane naturel)", "2026-11-23"),
  apple("i15pmax", "iPhone 15 Pro Max (titane naturel)", "2026-11-23"),
  apple("iphone15", "iPhone 15 (bleu)", "2026-11-23"),
  apple("iphone15plus", "iPhone 15 Plus (bleu)", "2026-11-23"),
  apple("iphone14pro", "iPhone 14 Pro (violet intense)", "2026-11-23"),
  apple("i14pmax", "iPhone 14 Pro Max (violet intense)", "2026-11-23"),
  apple("iphone14", "iPhone 14 (bleu)", "2026-11-23"),
  apple("iphone14plus", "iPhone 14 Plus (bleu)", "2026-11-23"),
  apple("iphone13pro", "iPhone 13 Pro (bleu alpin)", "2026-11-23"),
  apple("i13pmax", "iPhone 13 Pro Max (bleu alpin)", "2026-11-23"),
  fourni("iphone12pro", "iPhone 12 Pro (bleu pacifique)"),
  fourni("i12pmax", "iPhone 12 Pro Max (argent)"),
  apple("iphone13", "iPhone 13 (bleu)", "2026-11-23"),
  apple("iphone13mini", "iPhone 13 mini (bleu)", "2026-11-23"),
  apple("airpods4", "AirPods 4 (blanc)", "2026-11-23"),
  apple("a4aradb", "AirPods 4 avec réduction active du bruit (blanc)", "2026-11-23"),
  apple("ap2eg", "AirPods Pro (2e génération) (blanc)", "2026-11-23"),
  apple("awu2", "Apple Watch Ultra 2 (titane, bracelet Océan orange)", "2026-11-23"),
  samsung("galaxys25", "Galaxy S25 (bleu foncé)", "2026-11-23"),
  samsung("gs25plus", "Galaxy S25+ (bleu foncé)", "2026-11-23"),
  samsung("gs25u", "Galaxy S25 Ultra (noir titane)", "2026-11-23"),
  samsung("gs25edge", "Galaxy S25 Edge (bleu clair)", "2026-11-23"),
  samsung("gs26plus", "Galaxy S26+ (violet)", "2026-11-23"),
  samsung("galaxys26fe", "Galaxy S26 FE (vert pistache)", "2026-11-23"),
  samsung("gzfold8u", "Galaxy Z Fold8 Ultra (violet foncé)", "2026-11-23"),
  samsung("galaxyzfold7", "Galaxy Z Fold7 (noir)", "2026-11-23"),
  samsung("galaxyzflip7", "Galaxy Z Flip7 (noir)", "2026-11-23"),
  samsung("gzflip7fe", "Galaxy Z Flip7 FE (noir)", "2026-11-23"),
  samsung("galaxys23fe", "Galaxy S23 FE (indigo)", "2026-11-23"),
  samsung("galaxya565g", "Galaxy A56 5G (gris clair)", "2026-11-23"),
  samsung("galaxya365g", "Galaxy A36 5G (noir)", "2026-11-23"),
  samsung("galaxya375g", "Galaxy A37 5G (graphite)", "2026-11-23"),
  samsung("galaxya275g", "Galaxy A27 5G (rose pâle)", "2026-11-23"),
  samsung("galaxya175g", "Galaxy A17 5G (bleu marine)", "2026-11-23"),
  samsung("galaxywatch8", "Galaxy Watch8 (argent, bracelet sport blanc)", "2026-11-23"),
  samsung("gwatch8c", "Galaxy Watch8 Classic 46 mm (noir)", "2026-11-23"),
  samsung("galaxywatch7", "Galaxy Watch7 40 mm (crème, bracelet sport gris foncé)", "2026-11-23"),
  samsung("gwu", "Galaxy Watch Ultra (titane, bracelet orange)", "2026-11-23"),
  samsung("gbuds3fe", "Galaxy Buds3 FE (gris anthracite)", "2026-11-23"),
  xiaomi("xiaomi15", "Xiaomi 15 (vert menthe)", "2026-11-23"),
  xiaomi("x15u", "Xiaomi 15 Ultra (argent et noir)", "2026-11-23"),
  xiaomi("x14u", "Xiaomi 14 Ultra (noir)", "2026-11-23"),
  xiaomi("xiaomi14", "Xiaomi 14 (vert jade)", "2026-11-23"),
  xiaomi("xiaomi14tpro", "Xiaomi 14T Pro (gris titane)", "2026-11-23"),
  xiaomi("xiaomi14t", "Xiaomi 14T (bleu titane)", "2026-11-23"),
  xiaomi("rn14pp5g", "Redmi Note 14 Pro+ 5G (or rose)", "2026-11-23"),
  xiaomi("rn14p5g", "Redmi Note 14 Pro 5G (violet lavande)", "2026-11-23"),
  xiaomi("rn145g", "Redmi Note 14 5G (violet lavande)", "2026-11-23"),
  xiaomi("pocof7ultra", "POCO F7 Ultra (jaune POCO)", "2026-11-23"),
  xiaomi("pocof7pro", "POCO F7 Pro (noir)", "2026-11-23"),
  xiaomi("pocox7pro", "POCO X7 Pro (noir et jaune)", "2026-11-23"),
  xiaomi("pocox7", "POCO X7 (vert menthe)", "2026-11-23"),
  xiaomi("xiaomibuds5", "Xiaomi Buds 5 (argent titane)", "2026-11-23"),
  xiaomi("xb5pro", "Xiaomi Buds 5 Pro (argent titane)", "2026-11-23"),
  xiaomi("rb6pro", "Redmi Buds 6 Pro (violet)", "2026-11-23"),
  xiaomi("redmibuds6", "Redmi Buds 6 (vert menthe)", "2026-11-23"),
  xiaomi("rb6play", "Redmi Buds 6 Play (blanc)", "2026-11-23"),
  xiaomi("rb5pro", "Redmi Buds 5 Pro (blanc)", "2026-11-23"),
  xiaomi("redmibuds5", "Redmi Buds 5 (blanc)", "2026-11-23"),
  xiaomi("xos", "Xiaomi OpenWear Stereo (champagne)", "2026-11-23"),
  xiaomi("xws4", "Xiaomi Watch S4 (argent, bracelet noir)", "2026-11-23"),
  xiaomi("xiaomiwatch2", "Xiaomi Watch 2 (argent, bracelet cuir beige)", "2026-11-23"),
  xiaomi("redmiwatch5", "Redmi Watch 5 (violet)", "2026-11-23"),
  xiaomi("rw5lite", "Redmi Watch 5 Lite (noir)", "2026-11-23"),
  xiaomi("rw5a", "Redmi Watch 5 Active (noir)", "2026-11-23"),
  xiaomi("xsb9pro", "Xiaomi Smart Band 9 Pro (argent, bracelet beige)", "2026-11-23"),
  xiaomi("xsb9", "Xiaomi Smart Band 9 (blanc)", "2026-11-23"),
  xiaomi("xsb8pro", "Xiaomi Smart Band 8 Pro (noir)", "2026-11-23"),
  xiaomi("xws3", "Xiaomi Watch S3 (argent, bracelet gris clair)", "2026-11-23"),
];
