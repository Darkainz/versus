import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { BRANDS, type Brand, type DeviceKind } from "@/lib/brand-themes";
import type { Tables } from "@/lib/database.types";
import { supabase } from "@/lib/supabase/public";
import type { CatalogRepository } from "./repository";
import {
  CATEGORIES,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProductRow,
  type CategorySlug,
  type Compat,
  type HomeCatalog,
  type HomeEntry,
  type HomeSlotKind,
  type ProductDetail,
  type ProductSpecs,
  type ProductVariant,
} from "./types";

type CatalogSummary = Tables<"catalog_products">;
type ProductRow = Tables<"products">;
type VariantRow = Tables<"product_variants">;
type SpecsRow = Tables<"product_specs">;

function requireData<T>(data: T | null, error: PostgrestError | null, operation: string): T {
  if (error) {
    throw new Error(`Erreur Supabase pendant ${operation} : ${error.message}`, { cause: error });
  }
  if (data === null) {
    throw new Error(`Supabase n'a renvoyé aucune donnée pendant ${operation}.`);
  }
  return data;
}

function toBrand(value: string): Brand {
  const brand = BRANDS.find((candidate) => candidate === value);
  if (!brand) throw new Error(`Marque inconnue dans le catalogue Supabase : ${value}`);
  return brand;
}

function toCategory(value: string): CategorySlug {
  const category = CATEGORIES.find((candidate) => candidate === value);
  if (!category) throw new Error(`Catégorie inconnue dans le catalogue Supabase : ${value}`);
  return category;
}

function toDeviceKind(value: string): DeviceKind {
  if (
    value === "phone" ||
    value === "watch" ||
    value === "round" ||
    value === "band" ||
    value === "buds"
  ) {
    return value;
  }
  throw new Error(`Type de visuel inconnu dans le catalogue Supabase : ${value}`);
}

function toCompat(values: string[]): readonly Compat[] {
  return values.map((value) => {
    if (value === "ios" || value === "android") return value;
    throw new Error(`Compatibilité inconnue dans le catalogue Supabase : ${value}`);
  });
}

function toVariant(row: VariantRow): ProductVariant {
  return {
    sku: row.sku,
    color_name: row.color_name,
    color_slug: row.color_slug,
    color_hex: row.color_hex,
    storage_gb: row.storage_gb,
    size_mm: row.size_mm,
    price_fcfa: row.price_fcfa,
    stock: row.stock,
    low_stock_threshold: row.low_stock_threshold,
    is_default: row.is_default,
    is_active: row.is_active,
    position: row.position,
  };
}

function toSpecs(row: SpecsRow): ProductSpecs {
  return {
    ...(row.screen_size_in === null ? {} : { screen_size_in: row.screen_size_in }),
    ...(row.screen_tech === null ? {} : { screen_tech: row.screen_tech }),
    ...(row.refresh_hz === null ? {} : { refresh_hz: row.refresh_hz }),
    ...(row.chip === null ? {} : { chip: row.chip }),
    ...(row.battery_mah === null ? {} : { battery_mah: row.battery_mah }),
    ...(row.autonomy_hours === null ? {} : { autonomy_hours: row.autonomy_hours }),
    ...(row.charging_w === null ? {} : { charging_w: row.charging_w }),
    ...(row.main_camera_mp === null ? {} : { main_camera_mp: row.main_camera_mp }),
    ...(row.weight_g === null ? {} : { weight_g: row.weight_g }),
    ...(row.ip_rating === null ? {} : { ip_rating: row.ip_rating }),
    ...(row.has_5g === null ? {} : { has_5g: row.has_5g }),
    ...(row.has_anc === null ? {} : { has_anc: row.has_anc }),
    specs_note: row.specs_note,
  };
}

function toProductRow(summary: CatalogSummary): CatalogProductRow {
  return {
    id: summary.id,
    code: summary.code,
    slug: summary.slug,
    name: summary.name,
    tagline: summary.tagline,
    brand_slug: toBrand(summary.brand_slug),
    brand_name: summary.brand_name,
    category_slug: toCategory(summary.category_slug),
    compare_group: summary.compare_group,
    visual_kind: toDeviceKind(summary.visual_kind),
    release_date: summary.release_date,
    new_until: summary.new_until,
    warranty_months: summary.warranty_months,
    compat: toCompat(summary.compat),
    min_price_fcfa: summary.min_price_fcfa,
    max_price_fcfa: summary.max_price_fcfa,
    in_stock: summary.in_stock ?? false,
    image_src: summary.image_src,
    image_width: summary.image_width,
    image_height: summary.image_height,
    image_alt: summary.image_alt,
  };
}

async function listProducts(): Promise<readonly CatalogProductRow[]> {
  const { data, error } = await supabase
    .from("catalog_products")
    .select("*")
    .order("release_date", { ascending: false });

  const summaries = requireData(data, error, "la liste des produits du catalogue");
  return summaries.map(toProductRow);
}

async function getProductDetail(
  summary: CatalogSummary,
  details: ProductRow,
  variants: readonly VariantRow[],
  specs: SpecsRow | null,
): Promise<ProductDetail> {
  const row = toProductRow(summary);
  return {
    ...row,
    description: details.description,
    variants: variants.map(toVariant),
    specs: specs ? toSpecs(specs) : { specs_note: "Valeurs indicatives, projet pédagogique." },
  };
}

export const supabaseCatalogRepository: CatalogRepository = {
  listProducts,

  async getProductBySlug(slug: string): Promise<ProductDetail | null> {
    const [summaryResult, detailsResult] = await Promise.all([
      supabase.from("catalog_products").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("products").select("*").eq("slug", slug).maybeSingle(),
    ]);

    if (summaryResult.error) {
      throw new Error(
        `Erreur Supabase pendant le sommaire du produit ${slug} : ${summaryResult.error.message}`,
        {
          cause: summaryResult.error,
        },
      );
    }
    if (detailsResult.error) {
      throw new Error(
        `Erreur Supabase pendant les détails du produit ${slug} : ${detailsResult.error.message}`,
        {
          cause: detailsResult.error,
        },
      );
    }
    const summary = summaryResult.data;
    const details = detailsResult.data;
    if (!summary || !details) return null;

    const [variantsResult, specsResult] = await Promise.all([
      supabase.from("product_variants").select("*").eq("product_id", summary.id).order("position"),
      supabase.from("product_specs").select("*").eq("product_id", summary.id).maybeSingle(),
    ]);

    const variants = requireData(
      variantsResult.data,
      variantsResult.error,
      `les variantes du produit ${slug}`,
    );
    if (specsResult.error) {
      throw new Error(
        `Erreur Supabase pendant les specs du produit ${slug} : ${specsResult.error.message}`,
        {
          cause: specsResult.error,
        },
      );
    }
    const specs = specsResult.data;

    return getProductDetail(summary, details, variants, specs);
  },

  async getHome(): Promise<HomeCatalog> {
    const [summariesResult, detailsResult, variantsResult, specsResult, slotsResult] =
      await Promise.all([
        supabase.from("catalog_products").select("*"),
        supabase.from("products").select("*").eq("is_active", true),
        supabase.from("product_variants").select("*").order("position"),
        supabase.from("product_specs").select("*"),
        supabase.from("home_slots").select("*").eq("is_active", true).order("position"),
      ]);

    const summaries = requireData(
      summariesResult.data,
      summariesResult.error,
      "les sommaires d'accueil",
    );
    const details = requireData(
      detailsResult.data,
      detailsResult.error,
      "les détails des produits d'accueil",
    );
    const variants = requireData(
      variantsResult.data,
      variantsResult.error,
      "les variantes d'accueil",
    );
    const specs = requireData(
      specsResult.data,
      specsResult.error,
      "les fiches techniques d'accueil",
    );
    const slots = requireData(slotsResult.data, slotsResult.error, "les emplacements d'accueil");

    const summariesById = new Map(summaries.map((s) => [s.id, s]));
    const detailsById = new Map(details.map((d) => [d.id, d]));
    const variantsByProduct = new Map<string, VariantRow[]>();
    for (const v of variants) {
      const list = variantsByProduct.get(v.product_id) ?? [];
      list.push(v);
      variantsByProduct.set(v.product_id, list);
    }
    const specsByProduct = new Map(specs.map((s) => [s.product_id, s]));

    const productsById = new Map<string, ProductDetail>();
    for (const [id, summary] of summariesById.entries()) {
      const d = detailsById.get(id);
      if (d) {
        const v = variantsByProduct.get(id) ?? [];
        const s = specsByProduct.get(id) ?? null;
        productsById.set(id, {
          ...toProductRow(summary),
          description: d.description,
          variants: v.map(toVariant),
          specs: s ? toSpecs(s) : { specs_note: "Valeurs indicatives." },
        });
      }
    }

    const grouped: HomeCatalog = {
      hero: [],
      tile: [],
      rail: [],
      compare: [],
    };

    for (const slot of slots) {
      const product = productsById.get(slot.product_id);
      if (!product) {
        throw new Error(`L'emplacement ${slot.slot} référence un produit inactif ou absent.`);
      }
      const entry: HomeEntry = {
        position: slot.position,
        theme_key: slot.theme_key,
        headline: slot.headline,
        subline: slot.subline,
        product,
      };
      grouped[slot.slot as HomeSlotKind].push(entry);
    }

    return grouped;
  },

  async listBrands(): Promise<readonly CatalogBrand[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("slug, name, tagline, position")
      .order("position");
    return requireData(data, error, "la liste des marques").map((brand) => ({
      slug: toBrand(brand.slug),
      name: brand.name,
      tagline: brand.tagline,
      position: brand.position,
    }));
  },

  async listCategories(): Promise<readonly CatalogCategory[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("slug, name, intro, compare_group, position")
      .order("position");
    return requireData(data, error, "la liste des catégories").map((category) => ({
      slug: toCategory(category.slug),
      name: category.name,
      intro: category.intro,
      compare_group: category.compare_group,
      position: category.position,
    }));
  },

  async getVariantsStock(productId: string): Promise<readonly ProductVariant[]> {
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .eq("is_active", true)
      .order("position");
    return requireData(data, error, "le stock des variantes").map(toVariant);
  },
};
