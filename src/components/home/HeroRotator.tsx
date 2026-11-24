"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CarouselControls, type CarouselIcons } from "./CarouselControls";
import { usePageLoaded } from "./use-page-loaded";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const AUTOPLAY_DELAY = 6000;

function getReducedMotionQuery() {
  return typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
}

function subscribeReducedMotion(onChange: () => void) {
  const query = getReducedMotionQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return getReducedMotionQuery()?.matches ?? true;
}

export type HeroRotatorSlide = {
  key: string;
  name: string;
  tone: "dark" | "light";
  style: Record<`--${string}`, string>;
  content: ReactNode;
};

/**
 * Îlot client du hero : diapositive active et commandes. Les diapositives sont rendues par le
 * serveur (`content`).
 * - rotation automatique toutes les 6 s, contrôlable par un bouton et suspendue au focus (hors
 *   bouton de lecture/pause) et quand l'onglet est masqué ; elle est désactivée sous mouvement réduit ;
 * - chaque diapositive est un `group` « diapositive » nommé « n sur N » ; chaque changement
 *   manuel est annoncé avec `aria-live="polite"`, tandis que les changements automatiques restent
 *   silencieux ;
 * - les variables `--hero-*` de la diapositive active sont aussi posées sur la section, pour que
 *   les commandes (hors des diapositives) suivent son thème ;
 * - jusqu'à l'événement `load` (ou au premier changement), les diapositives cachées ne sont pas
 *   affichées (`data-deferred`) : leurs visuels ne concurrencent pas celui de la première (LCP).
 */
export function HeroRotator({
  slides,
  icons,
}: {
  slides: readonly HeroRotatorSlide[];
  icons: CarouselIcons;
}) {
  const [active, setActive] = useState(0);
  /** Faux jusqu'au premier changement : l'entrée animée ne rejoue pas au chargement (LCP). */
  const [changed, setChanged] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const loaded = usePageLoaded();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => true);
  const count = slides.length;
  const current = slides[active];
  const autoplay = loaded && count > 1 && !reducedMotion;
  const paused = userPaused || focused || !pageVisible;

  useEffect(() => {
    function syncPageVisibility() {
      setPageVisible(document.visibilityState !== "hidden");
    }

    syncPageVisibility();
    document.addEventListener("visibilitychange", syncPageVisibility);
    return () => document.removeEventListener("visibilitychange", syncPageVisibility);
  }, []);

  useEffect(() => {
    if (!autoplay || paused) return;

    const timeout = window.setTimeout(() => {
      setActive((index) => (index + 1) % count);
      setChanged(true);
    }, AUTOPLAY_DELAY);
    return () => window.clearTimeout(timeout);
  }, [active, autoplay, count, paused]);

  if (!current) return null;

  function goTo(index: number) {
    setActive((index + count) % count);
    setChanged(true);
  }

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Produits à la une"
      className="hero-carousel"
      data-tone={current.tone}
      data-autoplay={autoplay ? "" : undefined}
      data-paused={autoplay && paused ? "" : undefined}
      data-changed={changed ? "" : undefined}
      data-deferred={loaded || changed ? undefined : ""}
      style={current.style as CSSProperties}
      onFocusCapture={(event) => {
        const target = event.target;
        setFocused(
          !(target instanceof HTMLElement && target.hasAttribute("data-carousel-playback")),
        );
      }}
      onBlurCapture={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !event.currentTarget.contains(event.relatedTarget)
        ) {
          setFocused(false);
        }
      }}
    >
      <div className="hero-slides" aria-live={autoplay && !paused ? "off" : "polite"}>
        {slides.map((slide, index) => {
          const selected = index === active;
          return (
            <div
              key={slide.key}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${index + 1} sur ${count}`}
              aria-hidden={selected ? undefined : true}
              inert={!selected}
              data-product-slide={slide.key}
              data-tone={slide.tone}
              className={selected ? "hero-slide hero-slide-active" : "hero-slide"}
              style={slide.style as CSSProperties}
            >
              {slide.content}
            </div>
          );
        })}
      </div>
      <CarouselControls
        names={slides.map((slide) => slide.name)}
        active={active}
        icons={icons}
        autoplay={autoplay}
        paused={userPaused}
        onSelect={goTo}
        onTogglePause={() => setUserPaused((currentPaused) => !currentPaused)}
      />
    </section>
  );
}
