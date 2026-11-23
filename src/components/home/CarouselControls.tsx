import type { KeyboardEvent, ReactNode } from "react";

export type CarouselIcons = {
  previous: ReactNode;
  next: ReactNode;
  play: ReactNode;
  pause: ReactNode;
};

/**
 * Commandes du carrousel : précédent, un point par diapositive, suivant et lecture/pause.
 * La sélection est toujours explicite, au clic ou avec les flèches du clavier.
 */
export function CarouselControls({
  names,
  active,
  icons,
  autoplay,
  paused,
  onSelect,
  onTogglePause,
}: {
  names: readonly string[];
  active: number;
  icons: CarouselIcons;
  autoplay: boolean;
  paused: boolean;
  onSelect: (index: number) => void;
  onTogglePause: () => void;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    onSelect(active + (event.key === "ArrowRight" ? 1 : -1));
  }

  return (
    <div
      className="hero-controls"
      role="group"
      aria-label="Commandes du carrousel"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="hero-button"
        aria-label="Diapositive précédente"
        onClick={() => onSelect(active - 1)}
      >
        {icons.previous}
      </button>
      {names.map((name, index) => {
        const current = index === active;
        return (
          <button
            key={name}
            type="button"
            className={current ? "hero-dot hero-dot-active" : "hero-dot"}
            aria-label={`Afficher ${name}`}
            aria-current={current ? "true" : undefined}
            onClick={() => onSelect(index)}
          >
            <span className="hero-dot-track">
              <span className="hero-dot-fill" />
            </span>
          </button>
        );
      })}
      <button
        type="button"
        className="hero-button"
        aria-label="Diapositive suivante"
        onClick={() => onSelect(active + 1)}
      >
        {icons.next}
      </button>
      {autoplay && (
        <button
          type="button"
          className="hero-button"
          aria-label={
            paused
              ? "Reprendre le défilement automatique"
              : "Mettre le défilement automatique en pause"
          }
          data-carousel-playback=""
          onClick={onTogglePause}
        >
          {paused ? icons.play : icons.pause}
        </button>
      )}
    </div>
  );
}
