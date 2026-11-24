import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";

export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin("/admin");
  return (
    <main id="contenu" tabIndex={-1} className="wrap flex-1 py-10 outline-none">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line-soft pb-5">
        <p className="text-xl font-bold">Administration VERSUS</p>
        <nav aria-label="Administration" className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/admin">
            Tableau de bord
          </Link>
          <Link className="underline" href="/admin/produits">
            Produits
          </Link>
          <Link className="underline" href="/admin/stock">
            Stock
          </Link>
          <Link className="underline" href="/admin/commandes">
            Commandes
          </Link>
          <Link className="underline" href="/admin/livraison">
            Livraison
          </Link>
          <Link className="underline" href="/admin/accueil">
            Accueil
          </Link>
          <Link className="underline" href="/admin/clients">
            Clients
          </Link>
          <Link className="underline" href="/compte">
            Mon compte
          </Link>
        </nav>
      </header>
      {children}
    </main>
  );
}
