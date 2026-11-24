import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("annonce l’étape actuelle sans marquer les autres comme courantes", () => {
    render(
      <Stepper steps={["Coordonnées", "Livraison", "Paiement", "Vérification"]} current={2} />,
    );

    expect(screen.getByRole("list", { name: "Étapes de la commande" })).toBeTruthy();
    expect(
      screen
        .getByText(/Paiement/)
        .closest("li")
        ?.getAttribute("aria-current"),
    ).toBe("step");
    expect(
      screen
        .getByText(/Livraison/)
        .closest("li")
        ?.getAttribute("aria-current"),
    ).toBeNull();
  });
});
