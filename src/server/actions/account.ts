"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import {
  initialAddressActionState,
  type AddressActionState,
} from "@/lib/auth/address-action-state";
import {
  initialDeleteAccountActionState,
  type DeleteAccountActionState,
} from "@/lib/auth/delete-account-action-state";
import {
  initialCancelOrderActionState,
  type CancelOrderActionState,
} from "@/lib/auth/cancel-action-state";
import {
  initialClaimOrderActionState,
  type ClaimOrderActionState,
} from "@/lib/auth/claim-action-state";
import {
  initialProfileActionState,
  type ProfileActionState,
} from "@/lib/auth/profile-action-state";
import { ORDER_NUMBER_PATTERN } from "@/lib/orders/order-view";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrderToken } from "@/lib/orders/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/env.server";
import { addressSchema } from "@/lib/validation/address";
import { profileSchema } from "@/lib/validation/profile";

function formString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function formBoolean(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export async function saveAddress(
  _previous: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireUser("/compte/adresses");
  const parsed = addressSchema.safeParse({
    id: formString(formData, "id") || undefined,
    label: formString(formData, "label"),
    recipient_name: formString(formData, "recipient_name"),
    phone: formString(formData, "phone"),
    zone_code: formString(formData, "zone_code"),
    city: formString(formData, "city"),
    district: formString(formData, "district"),
    landmark: formString(formData, "landmark"),
    instructions: formString(formData, "instructions"),
    is_default: formBoolean(formData, "is_default"),
  });
  if (!parsed.success) {
    return {
      ...initialAddressActionState,
      error: parsed.error.issues[0]?.message ?? "Vérifiez les champs de l’adresse.",
    };
  }

  const { id, ...address } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { is_default: isDefault, ...fields } = address;
  const payload = { ...fields, is_default: isDefault, user_id: user.id };
  if (id) {
    const { data: existingAddress, error } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !existingAddress) {
      if (error) console.error("La vérification de l’adresse a échoué.", error);
      return {
        ...initialAddressActionState,
        error: "Cette adresse est introuvable.",
      };
    }
  }
  const { data: activeZone, error: zoneError } = await supabase
    .from("delivery_zones")
    .select("code")
    .eq("code", address.zone_code)
    .eq("is_active", true)
    .maybeSingle();
  if (zoneError || !activeZone) {
    if (zoneError) console.error("La vérification de la zone de livraison a échoué.", zoneError);
    return {
      ...initialAddressActionState,
      error: "Choisissez une zone de livraison active.",
    };
  }
  const clearDefaults = supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)
    .eq("is_default", true);
  const result = id
    ? await (async () => {
        if (address.is_default) {
          const { error } = await clearDefaults.neq("id", id);
          if (error) return { data: null, error };
        }
        return supabase
          .from("addresses")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id)
          .select("id")
          .maybeSingle();
      })()
    : await (async () => {
        if (address.is_default) {
          const { error } = await clearDefaults;
          if (error) return { data: null, error };
        }
        return supabase.from("addresses").insert(payload).select("id").maybeSingle();
      })();
  if (result.error || !result.data) {
    if (result.error) console.error("L’enregistrement de l’adresse a échoué.", result.error);
    return {
      ...initialAddressActionState,
      error: result.error
        ? "Impossible d’enregistrer cette adresse. Vérifiez la zone puis réessayez."
        : "Cette adresse est introuvable.",
    };
  }

  revalidatePath("/compte/adresses");
  return { ...initialAddressActionState, success: "Adresse enregistrée." };
}

export async function deleteAddress(
  _previous: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await requireUser("/compte/adresses");
  const id = formString(formData, "id");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return { ...initialAddressActionState, error: "Identifiant d’adresse invalide." };
  }
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("La suppression de l’adresse a échoué.", error);
    return { ...initialAddressActionState, error: "Impossible de supprimer cette adresse." };
  }
  if (!data) {
    return { ...initialAddressActionState, error: "Cette adresse est introuvable." };
  }
  revalidatePath("/compte/adresses");
  return { ...initialAddressActionState, success: "Adresse supprimée." };
}

export async function deleteMyAccount(
  _previous: DeleteAccountActionState,
  formData: FormData,
): Promise<DeleteAccountActionState> {
  const user = await requireUser("/compte/donnees");
  if (formString(formData, "confirmation") !== "SUPPRIMER") {
    return {
      ...initialDeleteAccountActionState,
      error: "Saisissez exactement SUPPRIMER pour confirmer.",
    };
  }
  if (
    !supabaseEnv.NEXT_PUBLIC_SUPABASE_URL ||
    !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    !supabaseEnv.SUPABASE_SECRET_KEY
  ) {
    return {
      ...initialDeleteAccountActionState,
      error: "La suppression du compte n’est pas configurée pour cet environnement.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: anonymizeError } = await supabase.rpc("anonymize_my_account");
  if (anonymizeError) {
    console.error("L’anonymisation des commandes a échoué.", anonymizeError);
    return {
      ...initialDeleteAccountActionState,
      error: "Impossible d’anonymiser les commandes. Le compte n’a pas été supprimé.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("La suppression du compte Auth a échoué après anonymisation.", deleteError);
    return {
      ...initialDeleteAccountActionState,
      error:
        "Les commandes ont été anonymisées, mais le compte n’a pas pu être supprimé. Réessayez.",
    };
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("La fermeture de session après suppression a échoué.", signOutError);
  }
  redirect("/");
}

export async function updateProfile(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await requireUser("/compte/profil");
  const parsed = profileSchema.safeParse({
    full_name: formString(formData, "full_name"),
    phone: formString(formData, "phone"),
  });
  if (!parsed.success) {
    return {
      ...initialProfileActionState,
      error: parsed.error.issues[0]?.message ?? "Vérifiez les champs du profil.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone })
    .eq("id", user.id);
  if (error) {
    console.error("La mise à jour du profil a échoué.", error);
    return {
      ...initialProfileActionState,
      error: "Impossible d’enregistrer le profil. Réessayez.",
    };
  }

  revalidatePath("/compte");
  revalidatePath("/compte/profil");
  return { ...initialProfileActionState, success: "Profil enregistré." };
}

export async function cancelMyOrder(
  _previous: CancelOrderActionState,
  formData: FormData,
): Promise<CancelOrderActionState> {
  const number = formString(formData, "number");
  if (!ORDER_NUMBER_PATTERN.test(number)) {
    return { ...initialCancelOrderActionState, error: "Numéro de commande invalide." };
  }
  await requireUser(`/compte/commandes/${number}`);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("cancel_my_order", { p_number: number });
  if (error) {
    if (error.message.includes("VS_NOT_FOUND")) {
      return { ...initialCancelOrderActionState, error: "Commande introuvable." };
    }
    if (error.message.includes("VS_NOT_CANCELLABLE")) {
      return {
        ...initialCancelOrderActionState,
        error: "Cette commande ne peut plus être annulée.",
      };
    }
    console.error("L'annulation de la commande a échoué.", error);
    return {
      ...initialCancelOrderActionState,
      error: "Impossible d’annuler la commande. Réessayez.",
    };
  }

  revalidatePath("/compte/commandes");
  revalidatePath(`/compte/commandes/${number}`);
  return {
    ...initialCancelOrderActionState,
    success: data
      ? "Commande annulée ; le stock simulé a été restitué."
      : "Le délai de paiement était dépassé ; la commande a expiré.",
  };
}

export async function claimGuestOrder(
  _previous: ClaimOrderActionState,
  formData: FormData,
): Promise<ClaimOrderActionState> {
  const number = formString(formData, "number");
  if (!ORDER_NUMBER_PATTERN.test(number)) {
    return { ...initialClaimOrderActionState, error: "Numéro de commande invalide." };
  }
  await requireUser(`/commande/${number}/confirmation`);
  const token = await getOrderToken(number);
  if (!token) {
    return {
      ...initialClaimOrderActionState,
      error: "Le jeton de cette commande est introuvable dans ce navigateur.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("claim_guest_order", {
    p_number: number,
    p_token: token,
  });
  if (error) {
    if (error.message.includes("VS_NOT_FOUND")) {
      return {
        ...initialClaimOrderActionState,
        error: "Cette commande ne peut pas être rattachée à ce compte.",
      };
    }
    console.error("Le rattachement de la commande invitée a échoué.", error);
    return {
      ...initialClaimOrderActionState,
      error: "Impossible de rattacher cette commande. Réessayez.",
    };
  }

  revalidatePath("/compte");
  revalidatePath("/compte/commandes");
  return { ...initialClaimOrderActionState, success: "Commande rattachée à votre compte." };
}
