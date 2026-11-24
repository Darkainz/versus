import { Suspense } from "react";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Logo } from "@/components/layout/Logo";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CompareTrayLoader } from "@/components/compare/CompareTrayLoader";
import { site } from "@/config/site";

function HeaderFallback() {
  return (
    <header className="sticky top-0 z-50 border-b border-header-line bg-header-bg">
      <div className="wrap flex h-[var(--header-height)] items-center">
        <Logo />
        <span className="sr-only">Navigation en cours de chargement</span>
      </div>
    </header>
  );
}

function FooterFallback() {
  return (
    <footer className="bg-surface pt-[60px] pb-10 text-[13px] leading-[normal] text-muted">
      <div className="wrap">
        <p>
          © {site.copyrightYear} {site.name} · {site.legal}
        </p>
      </div>
    </footer>
  );
}

/**
 * Gabarit public (§3.1) : bandeau fictif, en-tête, <main id="contenu">, pied de page, dans cet
 * ordre. `banner` (header) et `contentinfo` (footer) restent au premier niveau, hors du <main>.
 * Le mini-panier (CartDrawer) n'est pas posé ici : l'icône de l'en-tête (CartButton) le charge
 * à la première ouverture. Le tiroir du comparateur est un îlot client global.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AnnouncementBar />
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="contenu" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        {children}
      </main>
      <Suspense fallback={<FooterFallback />}>
        <SiteFooter />
      </Suspense>
      <CompareTrayLoader />
    </>
  );
}
