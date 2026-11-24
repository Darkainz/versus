import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeroRotator, type HeroRotatorSlide } from "./HeroRotator";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const icons = { previous: "‹", next: "›", play: "play", pause: "pause" };
const slides: HeroRotatorSlide[] = ["ip18", "s26u", "x17u"].map((key) => ({
  key,
  name: `Produit ${key}`,
  tone: "dark",
  style: { "--hero-ink": "white" },
  content: (
    <>
      <h2>{key}</h2>
      <a href={`/produit/${key}`}>Voir {key}</a>
    </>
  ),
}));

function carousel() {
  return document.querySelector<HTMLElement>(".hero-carousel")!;
}

function activeSlide() {
  return document.querySelector(".hero-slide-active")?.getAttribute("data-product-slide");
}

function groups() {
  return Array.from(document.querySelectorAll<HTMLElement>("[aria-roledescription='diapositive']"));
}

function setReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const visibilityStateDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState");

afterEach(() => {
  if (visibilityStateDescriptor) {
    Object.defineProperty(document, "visibilityState", visibilityStateDescriptor);
  } else {
    Reflect.deleteProperty(document, "visibilityState");
  }
});

describe("HeroRotator", () => {
  it("expose chaque diapositive comme un groupe « n sur N » dans un carrousel nommé", () => {
    render(<HeroRotator slides={slides} icons={icons} />);
    expect(groups().map((group) => group.getAttribute("aria-label"))).toEqual([
      "1 sur 3",
      "2 sur 3",
      "3 sur 3",
    ]);
    for (const group of groups()) expect(group.getAttribute("role")).toBe("group");
    expect(carousel().getAttribute("aria-roledescription")).toBe("carrousel");
    expect(carousel().getAttribute("aria-label")).toBe("Produits à la une");
  });

  it("masque les diapositives inactives aux lecteurs d'écran et au clavier (aria-hidden, inert)", () => {
    // jsdom n'implémente pas la propriété `inert` : on lit l'attribut.
    render(<HeroRotator slides={slides} icons={icons} />);
    const [first, second, third] = groups();
    expect(first!.hasAttribute("aria-hidden")).toBe(false);
    expect(first!.hasAttribute("inert")).toBe(false);
    for (const hidden of [second!, third!]) {
      expect(hidden.getAttribute("aria-hidden")).toBe("true");
      expect(hidden.hasAttribute("inert")).toBe(true);
    }
    // Seul le lien de la diapositive affichée est exposé.
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(["Voir ip18"]);
  });

  it("avance automatiquement et n'annonce pas les changements automatiques", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<HeroRotator slides={slides} icons={icons} />);
    expect(carousel().hasAttribute("data-autoplay")).toBe(true);
    expect(document.querySelector(".hero-slides")?.getAttribute("aria-live")).toBe("off");
    expect(activeSlide()).toBe("ip18");

    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("s26u");
  });

  it("continue au survol et permet de suspendre puis reprendre avec le bouton", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<HeroRotator slides={slides} icons={icons} />);

    fireEvent.mouseEnter(carousel());
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("s26u");
    expect(carousel().hasAttribute("data-paused")).toBe(false);

    const pause = screen.getByRole("button", { name: "Mettre le défilement automatique en pause" });
    fireEvent.click(pause);
    expect(carousel().hasAttribute("data-paused")).toBe(true);
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("s26u");

    fireEvent.click(screen.getByRole("button", { name: "Reprendre le défilement automatique" }));
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("x17u");
  });

  it("ne suspend pas la rotation lorsque le bouton lecture/pause reçoit le focus", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<HeroRotator slides={slides} icons={icons} />);

    screen.getByRole("button", { name: "Mettre le défilement automatique en pause" }).focus();
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("s26u");
  });

  it("suspend au focus et quand l'onglet est masqué", () => {
    setReducedMotion(false);
    vi.useFakeTimers();
    render(<HeroRotator slides={slides} icons={icons} />);
    const previous = screen.getByRole("button", { name: "Diapositive précédente" });

    fireEvent.focus(previous);
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("ip18");
    expect(carousel().hasAttribute("data-paused")).toBe(true);

    fireEvent.blur(previous, { relatedTarget: document.body });
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("ip18");

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    fireEvent(document, new Event("visibilitychange"));
    act(() => vi.advanceTimersByTime(6000));
    expect(activeSlide()).toBe("s26u");
  });

  it("désactive la rotation sous mouvement réduit", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    render(<HeroRotator slides={slides} icons={icons} />);
    act(() => vi.advanceTimersByTime(6000));
    expect(carousel().hasAttribute("data-autoplay")).toBe(false);
    expect(activeSlide()).toBe("ip18");
  });

  it("avance, recule et boucle de la dernière à la première diapositive", async () => {
    const user = userEvent.setup();
    render(<HeroRotator slides={slides} icons={icons} />);
    const next = screen.getByRole("button", { name: "Diapositive suivante" });
    await user.click(next);
    expect(activeSlide()).toBe("s26u");
    expect(groups()[1]!.hasAttribute("inert")).toBe(false);
    expect(groups()[0]!.hasAttribute("inert")).toBe(true);
    await user.click(next);
    expect(activeSlide()).toBe("x17u");
    await user.click(next);
    expect(activeSlide()).toBe("ip18");
    await user.click(screen.getByRole("button", { name: "Diapositive précédente" }));
    expect(activeSlide()).toBe("x17u");
  });

  it("choisit une diapositive avec son point et ne rejoue l'entrée animée qu'après un changement", async () => {
    const user = userEvent.setup();
    render(<HeroRotator slides={slides} icons={icons} />);
    expect(carousel().hasAttribute("data-changed")).toBe(false);
    await user.click(screen.getByRole("button", { name: "Afficher Produit s26u" }));
    expect(activeSlide()).toBe("s26u");
    expect(carousel().hasAttribute("data-changed")).toBe(true);
  });

  it("pose le thème de la diapositive active sur le carrousel (commandes comprises)", () => {
    render(<HeroRotator slides={slides} icons={icons} />);
    expect(carousel().getAttribute("data-tone")).toBe("dark");
    expect(carousel().style.getPropertyValue("--hero-ink")).toBe("white");
  });

  it("diffère l'affichage des diapositives cachées jusqu'au chargement de la page", () => {
    render(<HeroRotator slides={slides} icons={icons} />);
    // jsdom : `document.readyState` vaut « complete » après le rendu ; l'attribut a disparu.
    act(() => window.dispatchEvent(new Event("load")));
    expect(carousel().hasAttribute("data-deferred")).toBe(document.readyState !== "complete");
  });
});
