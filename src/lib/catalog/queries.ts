import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { staticCatalogRepository } from "./static-repository";
import { supabaseCatalogRepository } from "./supabase-repository";

const repository = isSupabaseConfigured ? supabaseCatalogRepository : staticCatalogRepository;

export async function getCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  return repository.listProducts();
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", `product:${slug}`);
  return repository.getProductBySlug(slug);
}

export async function getHome() {
  "use cache";
  cacheLife("hours");
  cacheTag("home");
  return repository.getHome();
}

export async function getBrands() {
  "use cache";
  cacheLife("max");
  cacheTag("catalog");
  return repository.listBrands();
}

export async function getCategories() {
  "use cache";
  cacheLife("max");
  cacheTag("catalog");
  return repository.listCategories();
}

/** Lecture dynamique du stock, sans cache (PPR pour LiveStock). */
export async function getVariantsStock(productId: string) {
  return repository.getVariantsStock(productId);
}
