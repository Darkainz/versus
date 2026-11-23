"use client";

import { usePathname } from "next/navigation";
import {
  lazy,
  Suspense,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { iconButtonClasses } from "@/components/ui/icon-button-styles";

/** Le menu mobile n'existe que sous ce seuil (maquette : `.nav { display: none }` ≤ 900 px). */
const DESKTOP_QUERY = "(min-width: 901px)";

const MenuDialog = lazy(() =>
  import("./MobileMenuDialogContent").then((module) => ({
    default: module.MobileMenuDialogContent,
  })),
);

/**
 * Îlot client du menu mobile : la boîte de dialogue complète est chargée au premier clic. Le
 * contenu (logo, liens, icônes) est rendu par le serveur et reçu en props.
 * - bouton « Menu » avec `aria-expanded` et `aria-controls` ;
 * - `<dialog>` plein écran : Échap ferme, focus piégé, focus rendu au bouton ;
 * - se ferme quand on suit un lien (délégation de clic : logo compris), quand le chemin change
 *   (retour arrière…), quand la fenêtre passe en mode bureau, et quand `<Activity>` masque la
 *   page quittée (Next 16, cacheComponents) : sinon un `<dialog>` modal resterait ouvert dans
 *   l'arbre caché et rendrait la nouvelle page inerte.
 */
export function MobileMenuDialog({
  menuIcon,
  closeIcon,
  logo,
  children,
}: {
  menuIcon: ReactNode;
  closeIcon: ReactNode;
  logo: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState(pathname);
  const dialogId = useId();
  const titleId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Changement de chemin : on ferme pendant le rendu (ajustement d'état recommandé par React).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Page masquée par <Activity> : le nettoyage s'exécute avant le masquage (preserving-ui-state.md).
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls={requested ? dialogId : undefined}
        aria-haspopup="dialog"
        className={iconButtonClasses}
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
      >
        {menuIcon}
      </button>
      {requested ? (
        <Suspense fallback={<div id={dialogId} hidden />}>
          <MenuDialog
            id={dialogId}
            titleId={titleId}
            open={open}
            onClose={close}
            returnFocusRef={buttonRef}
            closeIcon={closeIcon}
            logo={logo}
          >
            {children}
          </MenuDialog>
        </Suspense>
      ) : null}
    </div>
  );
}
