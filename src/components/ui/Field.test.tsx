import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";

describe("Field", () => {
  it("associe le libellé et le message d’aide au champ", () => {
    render(
      <Field
        id="phone"
        label="Téléphone"
        hint="Indicatif togolais."
        error="Numéro invalide."
        required
      >
        <input />
      </Field>,
    );

    const input = screen.getByLabelText(/Téléphone/);
    expect(input.getAttribute("aria-describedby")).toBe("phone-hint phone-error");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByText("Indicatif togolais.")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe("Numéro invalide.");
  });
});
