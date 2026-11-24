import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CarouselControls } from "./CarouselControls";

const icons = { previous: "‹", next: "›", play: "play", pause: "pause" };
const names = ["iPhone 18 Pro", "Galaxy S26 Ultra", "Xiaomi 17 Ultra"];

function setup(active = 1, autoplay = false, paused = false) {
  const onSelect = vi.fn();
  const onTogglePause = vi.fn();
  render(
    <CarouselControls
      names={names}
      active={active}
      icons={icons}
      autoplay={autoplay}
      paused={paused}
      onSelect={onSelect}
      onTogglePause={onTogglePause}
    />,
  );
  return { onSelect, onTogglePause };
}

describe("CarouselControls", () => {
  it("nomme chaque commande sans glyphe et marque seulement la diapositive affichée", () => {
    setup();
    expect(screen.getByRole("group", { name: "Commandes du carrousel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Diapositive précédente" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Diapositive suivante" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Afficher Galaxy S26 Ultra" })
        .getAttribute("aria-current"),
    ).toBe("true");
    for (const name of ["Afficher iPhone 18 Pro", "Afficher Xiaomi 17 Ultra"]) {
      expect(screen.getByRole("button", { name }).hasAttribute("aria-current")).toBe(false);
    }
  });

  it("n'affiche pas la commande lecture/pause quand la rotation est désactivée", () => {
    setup();
    expect(screen.queryByRole("button", { name: /défilement automatique/i })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("expose une commande lecture/pause accessible lorsque la rotation est active", async () => {
    const user = userEvent.setup();
    const { onTogglePause } = setup(1, true);
    const pause = screen.getByRole("button", { name: "Mettre le défilement automatique en pause" });
    await user.click(pause);
    expect(onTogglePause).toHaveBeenCalledOnce();
  });

  it("nomme la commande de reprise quand la rotation est en pause", () => {
    setup(1, true, true);
    expect(
      screen.getByRole("button", { name: "Reprendre le défilement automatique" }),
    ).toBeTruthy();
  });

  it("ne remplit que le point actif (● ○ ○)", () => {
    setup(0);
    const dots = document.querySelectorAll(".hero-dot");
    expect(dots[0]!.classList.contains("hero-dot-active")).toBe(true);
    expect(document.querySelectorAll(".hero-dot-active")).toHaveLength(1);
  });

  it("change de diapositive avec les flèches, les points et les flèches du clavier", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    await user.click(screen.getByRole("button", { name: "Diapositive suivante" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);
    await user.click(screen.getByRole("button", { name: "Diapositive précédente" }));
    expect(onSelect).toHaveBeenLastCalledWith(0);
    await user.click(screen.getByRole("button", { name: "Afficher Xiaomi 17 Ultra" }));
    expect(onSelect).toHaveBeenLastCalledWith(2);

    screen.getByRole("button", { name: "Afficher Galaxy S26 Ultra" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onSelect).toHaveBeenLastCalledWith(2);
    await user.keyboard("{ArrowLeft}");
    expect(onSelect).toHaveBeenLastCalledWith(0);
  });

  it("ignore les autres touches", async () => {
    const user = userEvent.setup();
    const { onSelect } = setup();
    screen.getByRole("button", { name: "Afficher Galaxy S26 Ultra" }).focus();
    await user.keyboard("{ArrowUp}");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
