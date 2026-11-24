import { headerActions, mainNav, mobileNav, routeFor, type HeaderActionKey } from "@/config/site";
import { IconButton } from "@/components/ui/IconButton";
import { CartButton } from "@/components/cart/CartButton";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { Logo } from "./Logo";
import { MainNav } from "./MainNav";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

const actionIcons: Record<HeaderActionKey, IconName> = {
  search: "search",
  compare: "compare",
  account: "account",
  cart: "cart",
};

const shopHref = routeFor("boutique");

/**
 * En-tête du site (maquette : `.hdr`), landmark `banner` de premier niveau.
 * - collant, 56 px ; translucide et flouté à partir de 901 px, opaque en dessous (le seuil de la navigation est à part : 1240 px) (écart :
 *   lisibilité et coût du flou sur mobile, voir docs/ecarts-maquette.md) ;
 * - navigation, icônes et menu mobile pilotés par config/site.ts : un élément dont la route
 *   n'est pas livrée est absent du DOM (à l'étape 2 : toutes les icônes et toute la navigation
 *   principale).
 * - lien « Tout le catalogue » à droite (refonte §3.5), seulement à partir de 1290 px : avec la
 *   navigation, les icônes et le logo, il faut 1 204 px de contenu, et la zone en offre 1 240 au plus ;
 * - navigation principale à partir de 1240 px (xl), menu mobile en dessous.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-header-line bg-header-bg md:bg-[var(--header-bg-translucent)] md:backdrop-blur-[20px] md:backdrop-saturate-[1.8]">
      <div className="wrap flex h-[var(--header-height)] items-center justify-between gap-5 max-[380px]:gap-2">
        <Logo />
        <MainNav groups={mainNav} />
        {shopHref ? (
          <NavLink
            href={shopHref}
            className="hidden text-[13.5px] font-medium whitespace-nowrap text-ink opacity-80 transition-opacity aria-[current=page]:opacity-100 min-[1290px]:block state-hover:opacity-100"
          >
            Tout le catalogue
          </NavLink>
        ) : null}
        <div className="flex items-center gap-0.5 max-[380px]:gap-0">
          {headerActions.map((action) =>
            action.key === "cart" ? (
              <CartButton
                key={action.key}
                href={action.href}
                shopHref={shopHref}
                icon={<Icon name="cart" />}
              />
            ) : (
              <IconButton
                key={action.key}
                href={action.href}
                label={action.label}
                icon={actionIcons[action.key]}
                className={action.key === "compare" ? "max-[340px]:hidden" : undefined}
                prefetch={false}
              />
            ),
          )}
          <MobileMenu groups={mobileNav} />
        </div>
      </div>
    </header>
  );
}
