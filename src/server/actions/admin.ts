"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseDeliverySettingsForm, parseHomeSlotForm } from "@/lib/validation/admin-settings";
import { parseProductSpecsForm } from "@/lib/validation/admin-specs";
import type {
  OrderStatusActionState,
  StockActionState,
  SettingsActionState,
  ImageActionState,
} from "@/lib/auth/admin-action-state";
import type { ProductAdminActionState } from "@/lib/auth/product-admin-action-state";

const stockSchema = z.object({
  variant_id: z.uuid(),
  delta: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "La variation ne peut pas être zéro."),
  reason: z.enum(["restock", "correction", "damage"]),
  note: z.string().trim().max(500).optional(),
});

export async function adjustStock(
  _previous: StockActionState,
  formData: FormData,
): Promise<StockActionState> {
  await requireAdmin("/admin/stock");
  const parsed = stockSchema.safeParse({
    variant_id: formData.get("variant_id"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs de l’ajustement.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_adjust_stock", {
    p_variant_id: parsed.data.variant_id,
    p_delta: parsed.data.delta,
    p_reason: parsed.data.reason,
    p_note: parsed.data.note,
  });
  if (error) {
    const message = error.message.includes("VS_INVALID")
      ? "La variation rendrait le stock négatif ou est invalide."
      : "Impossible d’ajuster le stock.";
    return { error: message, success: null };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/boutique");
  revalidatePath("/produit");
  return { success: `Stock ajusté. Nouveau stock : ${data}.`, error: null };
}

const orderStatusSchema = z.object({
  order_id: z.uuid(),
  to: z.enum(["cancelled", "preparing", "shipped", "delivered"]),
  note: z.string().trim().max(500).optional(),
  cash_collected: z.literal("on").optional(),
});

export async function setOrderStatus(
  _previous: OrderStatusActionState,
  formData: FormData,
): Promise<OrderStatusActionState> {
  await requireAdmin("/admin/commandes");
  const parsed = orderStatusSchema.safeParse({
    order_id: formData.get("order_id"),
    to: formData.get("to"),
    note: formData.get("note") || undefined,
    cash_collected: formData.get("cash_collected") || undefined,
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs de transition.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_set_order_status", {
    p_order_id: parsed.data.order_id,
    p_to: parsed.data.to,
    p_note: parsed.data.note,
    p_cash_collected: parsed.data.cash_collected === "on",
  });
  if (error) {
    if (error.message.includes("VS_CASH_REQUIRED")) {
      return {
        error: "Le montant à la livraison doit être confirmé avant la livraison.",
        success: null,
      };
    }
    if (error.message.includes("VS_NOT_TRANSITION")) {
      return { error: "Cette transition n’est pas autorisée.", success: null };
    }
    return { error: "Impossible de changer le statut.", success: null };
  }
  if (!data) return { error: "La transition n’a pas été appliquée.", success: null };

  revalidatePath("/admin");
  revalidatePath("/admin/commandes");
  revalidatePath("/compte/commandes");
  revalidatePath("/suivi");
  return { success: "Statut de commande mis à jour.", error: null };
}

const productSchema = z.object({
  id: z.uuid().optional(),
  code: z
    .string()
    .trim()
    .regex(/^[a-z0-9]{2,12}$/),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  brand_slug: z.string().trim().min(2).max(30),
  category_slug: z.enum(["smartphones", "ecouteurs", "montres", "bracelets"]),
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(300),
  description: z.string().trim().max(3000),
  visual_kind: z.enum(["phone", "watch", "round", "band", "buds"]),
  release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  new_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  warranty_months: z.coerce.number().int().min(0).max(36),
  compat: z.array(z.enum(["ios", "android"])),
  is_active: z.boolean(),
});

export async function saveProduct(
  _previous: ProductAdminActionState,
  formData: FormData,
): Promise<ProductAdminActionState> {
  await requireAdmin("/admin/produits");
  const parsed = productSchema.safeParse({
    id: formData.get("id")?.toString() || undefined,
    code: formData.get("code"),
    slug: formData.get("slug"),
    brand_slug: formData.get("brand_slug"),
    category_slug: formData.get("category_slug"),
    name: formData.get("name"),
    tagline: formData.get("tagline"),
    description: formData.get("description") ?? "",
    visual_kind: formData.get("visual_kind"),
    release_date: formData.get("release_date"),
    new_until: formData.get("new_until")?.toString() || undefined,
    warranty_months: formData.get("warranty_months"),
    compat: formData
      .getAll("compat")
      .filter((value): value is "ios" | "android" => value === "ios" || value === "android"),
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs du produit.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const payload = {
    code: parsed.data.code,
    slug: parsed.data.slug,
    brand_slug: parsed.data.brand_slug,
    category_slug: parsed.data.category_slug,
    name: parsed.data.name,
    tagline: parsed.data.tagline,
    description: parsed.data.description,
    visual_kind: parsed.data.visual_kind,
    release_date: parsed.data.release_date,
    new_until: parsed.data.new_until ?? null,
    warranty_months: parsed.data.warranty_months,
    compat: parsed.data.compat,
    is_active: parsed.data.is_active,
  };

  const result = parsed.data.id
    ? await supabase
        .from("products")
        .update(payload)
        .eq("id", parsed.data.id)
        .select("id, slug")
        .maybeSingle()
    : await supabase.from("products").insert(payload).select("id, slug").maybeSingle();

  if (result.error || !result.data) {
    if (result.error) {
      console.error("Création ou modification de produit :", result.error);
    }
    return {
      error: result.error?.message.includes("active")
        ? "Le produit actif exige une variante par défaut et une image principale."
        : "Impossible d’enregistrer le produit.",
      success: null,
    };
  }

  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/");
  revalidatePath(`/produit/${result.data.slug}`);
  revalidatePath(`/admin/produits/${result.data.id}/apercu`);
  return {
    success: parsed.data.id ? "Produit mis à jour." : "Produit créé.",
    error: null,
  };
}

const variantSchema = z.object({
  variant_id: z.uuid().optional(),
  product_id: z.uuid(),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{4,40}$/),
  color_name: z.string().trim().min(1).max(60),
  color_slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,30}$/),
  color_hex: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  storage_gb: z.coerce.number().int().positive().optional(),
  size_mm: z.coerce.number().int().min(20).max(60).optional(),
  price_fcfa: z.coerce.number().int().min(1000).max(5000000),
  low_stock_threshold: z.coerce.number().int().min(0).max(32767),
  is_default: z.boolean(),
  is_active: z.boolean(),
});

export async function saveVariant(
  _previous: ProductAdminActionState,
  formData: FormData,
): Promise<ProductAdminActionState> {
  await requireAdmin("/admin/produits");
  const storage = formData.get("storage_gb")?.toString();
  const size = formData.get("size_mm")?.toString();
  const parsed = variantSchema.safeParse({
    variant_id: formData.get("variant_id")?.toString() || undefined,
    product_id: formData.get("product_id"),
    sku: formData.get("sku"),
    color_name: formData.get("color_name"),
    color_slug: formData.get("color_slug"),
    color_hex: formData.get("color_hex")?.toString() || undefined,
    storage_gb: storage || undefined,
    size_mm: size || undefined,
    price_fcfa: formData.get("price_fcfa"),
    low_stock_threshold: formData.get("low_stock_threshold"),
    is_default: formData.get("is_default") === "on",
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs de la variante.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const variant = {
    product_id: parsed.data.product_id,
    sku: parsed.data.sku,
    color_name: parsed.data.color_name,
    color_slug: parsed.data.color_slug,
    color_hex: parsed.data.color_hex?.toUpperCase() ?? null,
    storage_gb: parsed.data.storage_gb ?? null,
    size_mm: parsed.data.size_mm ?? null,
    price_fcfa: parsed.data.price_fcfa,
    low_stock_threshold: parsed.data.low_stock_threshold,
    is_default: parsed.data.is_default,
    is_active: parsed.data.is_active,
  };

  if (parsed.data.variant_id) {
    const { data, error } = await supabase.rpc("admin_update_product_variant", {
      p_variant_id: parsed.data.variant_id,
      p_product_id: variant.product_id,
      p_sku: variant.sku,
      p_color_name: variant.color_name,
      p_color_slug: variant.color_slug,
      p_price_fcfa: variant.price_fcfa,
      p_low_stock_threshold: variant.low_stock_threshold,
      p_is_default: variant.is_default,
      p_is_active: variant.is_active,
      ...(variant.color_hex ? { p_color_hex: variant.color_hex } : {}),
      ...(variant.storage_gb !== null ? { p_storage_gb: variant.storage_gb } : {}),
      ...(variant.size_mm !== null ? { p_size_mm: variant.size_mm } : {}),
    });
    if (error) {
      const message = error.message.includes("VS_NOT_FOUND")
        ? "Cette variante n’existe plus pour ce produit."
        : error.message.includes("VS_INVALID")
          ? "Un produit actif doit conserver une variante par défaut active."
          : "Impossible d’enregistrer la variante.";
      return { error: message, success: null };
    }
    if (!data) {
      return { error: "La variante n’a pas été mise à jour.", success: null };
    }
  } else {
    const { error } = await supabase.from("product_variants").insert(variant);
    if (error) {
      return { error: "Impossible d’enregistrer la variante.", success: null };
    }
  }

  revalidatePath(`/admin/produits/${parsed.data.product_id}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  revalidatePath("/produit");
  revalidatePath("/produit/[slug]", "page");
  return {
    success: parsed.data.variant_id ? "Variante mise à jour." : "Variante créée avec stock 0.",
    error: null,
  };
}

export async function saveProductSpecs(
  _previous: ProductAdminActionState,
  formData: FormData,
): Promise<ProductAdminActionState> {
  await requireAdmin("/admin/produits");
  const parsed = parseProductSpecsForm(formData);
  if (!parsed.success) {
    return { error: "Vérifiez les spécifications du produit.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("product_specs").upsert(parsed.data, {
    onConflict: "product_id",
  });
  if (error) {
    console.error("Enregistrement des spécifications :", error);
    return { error: "Impossible d’enregistrer les spécifications.", success: null };
  }

  revalidatePath(`/admin/produits/${parsed.data.product_id}`);
  revalidatePath("/boutique");
  revalidatePath("/produit/[slug]", "page");
  return { success: "Spécifications enregistrées.", error: null };
}

export async function saveDeliverySettings(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireAdmin("/admin/livraison");
  const parsed = parseDeliverySettingsForm(formData);
  if (!parsed.success) {
    return { error: "Vérifiez les zones et paramètres de la boutique.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const { settings } = parsed.data;
  const { data, error } = await supabase.rpc("admin_save_delivery_settings", {
    p_zones: parsed.data.zones,
    p_settings: settings,
  });
  if (error) return { error: "Impossible d’enregistrer les paramètres.", success: null };
  if (!data) {
    return { error: "Les paramètres n’ont pas été enregistrés.", success: null };
  }

  revalidatePath("/admin/livraison");
  revalidatePath("/panier");
  revalidatePath("/commande");
  revalidatePath("/");
  return { success: "Paramètres enregistrés.", error: null };
}

export async function saveHomeSlot(
  _previous: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  await requireAdmin("/admin/accueil");
  const parsed = parseHomeSlotForm(formData);
  if (!parsed.success) {
    return { error: "Vérifiez l’emplacement d’accueil.", success: null };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("home_slots")
    .update({
      product_id: parsed.data.product_id,
      slot: parsed.data.slot,
      position: parsed.data.position,
      headline: parsed.data.headline || null,
      subline: parsed.data.subline || null,
      theme_key: parsed.data.theme_key,
      is_active: parsed.data.is_active,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "Impossible d’enregistrer l’emplacement.", success: null };

  revalidatePath("/admin/accueil");
  revalidatePath("/");
  return { success: "Emplacement enregistré.", error: null };
}

export async function uploadProductImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  await requireAdmin("/admin/produits");
  const productId = formData.get("product_id")?.toString();
  const file = formData.get("image");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const alt = formData.get("alt")?.toString().trim();
  if (
    !productId ||
    !(file instanceof File) ||
    file.size <= 0 ||
    file.size > 1024 * 1024 ||
    file.type !== "image/webp" ||
    !Number.isInteger(width) ||
    width <= 0 ||
    !Number.isInteger(height) ||
    height <= 0 ||
    !alt
  ) {
    return { error: "Le fichier doit être WebP, inférieur à 1 Mo et descriptif.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const path = `products/${productId}/${crypto.randomUUID()}.webp`;
  const uploaded = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: "image/webp", upsert: false });
  if (uploaded.error) {
    return { error: "Impossible de téléverser l’image.", success: null };
  }
  const publicUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    src: publicUrl,
    storage_path: path,
    width,
    height,
    alt,
  });
  if (error) {
    await supabase.storage.from("product-images").remove([path]);
    return { error: "Impossible d’enregistrer l’image.", success: null };
  }

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath(`/produit`);
  revalidatePath("/produit/[slug]", "page");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: "Image téléversée.", error: null };
}

export async function setProductImagePrimary(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  await requireAdmin("/admin/produits");
  const parsed = z.object({ image_id: z.uuid(), product_id: z.uuid() }).safeParse({
    image_id: formData.get("image_id"),
    product_id: formData.get("product_id"),
  });
  if (!parsed.success) return { error: "Image invalide.", success: null };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_set_product_image_primary", {
    p_image_id: parsed.data.image_id,
    p_product_id: parsed.data.product_id,
  });
  if (error) {
    const message = error.message.includes("VS_NOT_FOUND")
      ? "Cette image n’appartient pas à ce produit."
      : "Impossible de choisir l’image principale.";
    return { error: message, success: null };
  }
  if (!data) return { error: "L’image principale n’a pas été modifiée.", success: null };

  revalidatePath(`/admin/produits/${parsed.data.product_id}`);
  revalidatePath(`/produit`);
  revalidatePath("/produit/[slug]", "page");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: "Image principale mise à jour.", error: null };
}

export async function deleteProductImage(
  _previous: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  await requireAdmin("/admin/produits");
  const id = formData.get("id")?.toString();
  if (!id) return { error: "Image invalide.", success: null };
  const supabase = await createSupabaseServerClient();
  const { data: image, error: readError } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path, is_primary")
    .eq("id", id)
    .maybeSingle();
  if (readError || !image) return { error: "Image introuvable.", success: null };

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("is_active")
    .eq("id", image.product_id)
    .maybeSingle();
  if (productError || !product) return { error: "Produit introuvable.", success: null };
  if (image.is_primary && product.is_active) {
    return {
      error: "Choisissez une autre image principale avant de supprimer celle-ci.",
      success: null,
    };
  }

  if (image.storage_path) {
    const removed = await supabase.storage.from("product-images").remove([image.storage_path]);
    if (removed.error) return { error: "Impossible de supprimer l’objet image.", success: null };
  }
  const { error } = await supabase.from("product_images").delete().eq("id", id);
  if (error) return { error: "Impossible de supprimer l’image.", success: null };

  revalidatePath(`/admin/produits/${image.product_id}`);
  revalidatePath("/produit/[slug]", "page");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { success: "Image supprimée.", error: null };
}
