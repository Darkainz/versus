"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { initialAuthActionState } from "@/lib/auth/action-state";
import { requestPasswordReset, signIn, signUp, updatePassword } from "@/server/actions/auth";

type Mode = "sign-in" | "sign-up" | "forgot-password" | "update-password";

const inputClassName = "min-h-12 rounded-option border border-line bg-bg px-3 font-normal";

export function AuthForm({ mode, redirectTo = "/compte" }: { mode: Mode; redirectTo?: string }) {
  const action =
    mode === "sign-in"
      ? signIn
      : mode === "sign-up"
        ? signUp
        : mode === "forgot-password"
          ? requestPasswordReset
          : updatePassword;
  const [state, formAction, pending] = useActionState(action, initialAuthActionState);
  const emailField =
    mode === "sign-in" || mode === "sign-up" || mode === "forgot-password" ? (
      <Field id="email" label="Adresse e-mail" required error={state.fieldErrors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          className={inputClassName}
        />
      </Field>
    ) : null;
  const passwordFields =
    mode === "sign-in" || mode === "sign-up" ? (
      <Field id="password" label="Mot de passe" required error={state.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={8}
          maxLength={128}
          required
          className={inputClassName}
        />
      </Field>
    ) : mode === "update-password" ? (
      <>
        <Field
          id="password"
          label="Nouveau mot de passe"
          required
          error={state.fieldErrors?.password}
        >
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            className={inputClassName}
          />
        </Field>
        <Field
          id="password_confirmation"
          label="Confirmer le mot de passe"
          required
          error={state.fieldErrors?.password_confirmation}
        >
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            className={inputClassName}
          />
        </Field>
      </>
    ) : null;

  return (
    <form action={formAction} className="mt-7 grid gap-5">
      {mode === "sign-in" ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
      {mode === "sign-up" ? (
        <>
          <Field id="full_name" label="Nom complet" required error={state.fieldErrors?.full_name}>
            <input
              id="full_name"
              name="full_name"
              autoComplete="name"
              minLength={2}
              maxLength={120}
              required
              className={inputClassName}
            />
          </Field>
          {emailField}
          {passwordFields}
          <Field
            id="phone"
            label="Téléphone (facultatif)"
            hint="Numéro togolais, indicatif +228."
            error={state.fieldErrors?.phone}
          >
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              maxLength={24}
              className={inputClassName}
            />
          </Field>
          <div>
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input
                type="checkbox"
                name="privacy_accepted"
                value="on"
                required
                aria-describedby={state.fieldErrors?.privacy_accepted ? "privacy-error" : undefined}
                aria-invalid={state.fieldErrors?.privacy_accepted ? true : undefined}
                className="mt-1 size-5 rounded border-line accent-accent"
              />
              <span>
                J’accepte la{" "}
                <Link href="/confidentialite" className="underline">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>
            {state.fieldErrors?.privacy_accepted ? (
              <p id="privacy-error" role="alert" className="mt-1 text-sm text-danger">
                {state.fieldErrors.privacy_accepted}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {emailField}
          {passwordFields}
        </>
      )}
      {state.error ? (
        <p role="alert" className="rounded-option border border-danger bg-surface p-3 text-sm">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="rounded-option border border-line-soft bg-surface p-3 text-sm">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : submitLabel(mode)}
      </Button>
      {mode === "sign-in" ? (
        <Link href="/mot-de-passe-oublie" className="min-h-11 text-sm underline">
          Mot de passe oublié ?
        </Link>
      ) : null}
    </form>
  );
}

function submitLabel(mode: Mode): string {
  switch (mode) {
    case "sign-in":
      return "Se connecter";
    case "sign-up":
      return "Créer mon compte";
    case "forgot-password":
      return "Envoyer le lien";
    case "update-password":
      return "Enregistrer le nouveau mot de passe";
  }
}
