import type { NextConfig } from "next";

let remotePatterns: URL[] = [];
let dangerouslyAllowLocalIP = false;
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    remotePatterns = [new URL(`${supabaseUrl.origin}/storage/v1/object/public/product-images/**`)];
    dangerouslyAllowLocalIP =
      supabaseUrl.hostname === "127.0.0.1" || supabaseUrl.hostname === "localhost";
  } catch {
    remotePatterns = [];
  }
}

/**
 * En-têtes de sécurité (étape 9). La CSP est volontairement MINIMALE : pas de `script-src` strict,
 * car l'App Router injecte des scripts inline et un nonce rendrait toutes les pages dynamiques
 * (compromis documenté dans docs/decisions/006-noindex.md).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  // Pendant de frame-ancestors pour les navigateurs anciens.
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns,
    dangerouslyAllowLocalIP,
    // AVIF d'abord, WebP sinon (refonte, lot 1) : l'optimiseur choisit selon l'en-tête Accept,
    // le PNG source reste servi aux navigateurs qui n'acceptent ni l'un ni l'autre.
    formats: ["image/avif", "image/webp"],
    // Les visuels produits font au plus 900 px de côté (public/products/SOURCES.md) ; les
    // emplacements les plus grands (fiche produit) n'affichent pas plus de 520 px de haut, et
    // chaque largeur de plus alourdirait le srcset du HTML.
    deviceSizes: [384, 480, 640],
    imageSizes: [128, 192, 256],
    qualities: [75],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Noms officiels Samsung (refonte, lot 1) : les anciennes adresses restent valides.
  async redirects() {
    return [
      {
        source: "/produit/galaxy-buds-4",
        destination: "/produit/galaxy-buds4",
        permanent: true,
      },
      {
        source: "/produit/galaxy-watch-9",
        destination: "/produit/galaxy-watch9",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
