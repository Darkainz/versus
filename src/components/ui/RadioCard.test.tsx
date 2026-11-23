import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioCard } from "./RadioCard";

describe("RadioCard", () => {
  it("expose le titre et la description comme nom accessible du choix", () => {
    render(
      <RadioCard
        name="payment"
        value="card"
        title="Carte bancaire"
        description="Simulation uniquement."
      />,
    );

    expect(
      screen.getByRole("radio", { name: /Carte bancaireSimulation uniquement\./ }),
    ).toBeTruthy();
  });
});
