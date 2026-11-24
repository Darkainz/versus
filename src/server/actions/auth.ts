"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, siteUrl } from "@/lib/env";
import { supabaseEnv } from "@/lib/env.server";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { initialAuthActionState, type AuthActionState } from "@/lib/auth/action-state";
import { requireUser } from "@/lib/auth/dal";
import {
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

function getString(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return Object.fromEntries(
    error.issues.flatMap((issue) =>
      typeof issue.path[0] === "string" ? [[issue.path[0], issue.message]] : [],
    ),
  );
}

export async function signIn(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    redirect: getString(formData, "redirect"),
  });
  if (!parsed.success) {
    return {
      ...initialAuthActionState,
      error: "Vérifiez les champs du formulaire.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { ...initialAuthActionState, error: "Le service de connexion est indisponible." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    return { ...initialAuthActionState, error: "E-mail ou mot de passe incorrect." };
  }
  redirect(safeRedirect(parsed.data.redirect));
}

export async function signUp(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    full_name: getString(formData, "full_name"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
    phone: getString(formData, "phone"),
    privacy_accepted: getString(formData, "privacy_accepted"),
  });
  if (!parsed.success) {
    return {
      ...initialAuthActionState,
      error: "Vérifiez les champs du formulaire.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { ...initialAuthActionState, error: "Le service d’inscription est indisponible." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        privacy_accepted_at: new Date().toISOString(),
      },
    },
  });
  if (error) {
    return {
      ...initialAuthActionState,
      error: "Impossible de créer ce compte. Vérifiez l’adresse e-mail.",
    };
  }
  if (data.session && data.user && parsed.data.phone) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.full_name, phone: parsed.data.phone })
      .eq("id", data.user.id);
    if (profileError) {
      console.error("Le profil n'a pas pu être complété après l'inscription.", profileError);
      return {
        ...initialAuthActionState,
        error:
          "Le compte est créé, mais le profil n’a pas pu être enregistré. Connectez-vous pour réessayer.",
      };
    }
  }
  if (!data.session) {
    return {
      ...initialAuthActionState,
      success:
        "Compte créé. Suivez les instructions reçues par e-mail pour terminer l’inscription.",
    };
  }
  redirect("/compte");
}

export async function requestPasswordReset(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordResetRequestSchema.safeParse({ email: getString(formData, "email") });
  if (!parsed.success) {
    return {
      ...initialAuthActionState,
      error: "Saisissez une adresse e-mail valide.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  if (env.VERCEL_ENV) {
    return {
      ...initialAuthActionState,
      error:
        "La réinitialisation par e-mail est disponible uniquement dans la démonstration locale.",
    };
  }
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { ...initialAuthActionState, error: "Le service de réinitialisation est indisponible." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reinitialiser-mot-de-passe`,
  });
  if (error) {
    console.error("L'envoi local du lien de réinitialisation a échoué.", error);
    return {
      ...initialAuthActionState,
      error: "Impossible d’envoyer le lien. Réessayez plus tard.",
    };
  }
  return {
    ...initialAuthActionState,
    success: "Si ce compte existe, un lien de réinitialisation a été envoyé dans Mailpit.",
  };
}

export async function updatePassword(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: getString(formData, "password"),
    password_confirmation: getString(formData, "password_confirmation"),
  });
  if (!parsed.success) {
    return {
      ...initialAuthActionState,
      error: "Vérifiez le nouveau mot de passe.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { ...initialAuthActionState, error: "Le service de compte est indisponible." };
  }
  await requireUser("/compte/profil");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    console.error("La mise à jour du mot de passe a échoué.", error);
    return {
      ...initialAuthActionState,
      error: "La session de récupération a expiré. Demandez un nouveau lien.",
    };
  }
  redirect("/compte/profil?mot-de-passe=modifie");
}

export async function signOut(): Promise<void> {
  if (!supabaseEnv.NEXT_PUBLIC_SUPABASE_URL || !supabaseEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Le service de compte est indisponible.");
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Impossible de fermer la session.", { cause: error });
  redirect("/");
}
