import { describe, expect, it } from "vitest";
import { passwordUpdateSchema, signInSchema, signUpSchema } from "./auth";

describe("schémas Auth", () => {
  it("normalise l'e-mail et le téléphone à l'inscription", () => {
    expect(
      signUpSchema.parse({
        full_name: "Client Démo",
        email: "  CLIENT@EXAMPLE.COM ",
        password: "motdepasse123",
        phone: "90 12 34 56",
        privacy_accepted: "on",
      }),
    ).toMatchObject({
      email: "client@example.com",
      phone: "+22890123456",
    });
  });

  it("exige l'acceptation de la confidentialité", () => {
    const result = signUpSchema.safeParse({
      full_name: "Client Démo",
      email: "client@example.com",
      password: "motdepasse123",
      phone: "",
      privacy_accepted: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["privacy_accepted"]);
  });

  it("rejette les mots de passe de réinitialisation différents", () => {
    expect(
      passwordUpdateSchema.safeParse({
        password: "nouveaumdp123",
        password_confirmation: "autremdp123",
      }).success,
    ).toBe(false);
  });

  it("normalise l'adresse de connexion sans élargir le redirect", () => {
    expect(
      signInSchema.parse({
        email: "  CLIENT@EXAMPLE.COM ",
        password: "motdepasse123",
        redirect: "//evil.example",
      }),
    ).toMatchObject({ email: "client@example.com", redirect: "//evil.example" });
  });
});
