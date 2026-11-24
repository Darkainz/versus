import Link from "next/link";
import { site } from "@/config/site";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main
      id="contenu"
      className="wrap flex w-full flex-1 items-start justify-center py-12 md:py-20"
    >
      <section className="w-full max-w-lg rounded-card border border-line-soft bg-surface p-6 sm:p-9">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {site.name}
        </Link>
        {children}
        <p className="mt-8 border-t border-line-soft pt-5 text-xs text-muted">{site.legal}</p>
      </section>
    </main>
  );
}
