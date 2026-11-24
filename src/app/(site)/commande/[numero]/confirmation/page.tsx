import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { ClaimOrderButton } from "@/components/account/ClaimOrderButton";
import { getClaims } from "@/lib/auth/dal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { routeFor } from "@/config/site";
import { getOrderForViewer } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "Confirmation de commande simulée",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage({
  params,
}: PageProps<"/commande/[numero]/confirmation">) {
  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <h1 className="text-display-h2">Confirmation de commande</h1>
          <p role="status" className="mt-4 text-muted">
            Chargement de la commande…
          </p>
        </div>
      }
    >
      <OrderConfirmationPageContent params={params} />
    </Suspense>
  );
}

async function OrderConfirmationPageContent({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const order = await getOrderForViewer(numero);
  if (!order) notFound();
  if (order.status !== "confirmed") redirect(`/commande/${numero}/paiement`);
  const claims = await getClaims();
  const isSignedIn = typeof claims?.sub === "string";

  return (
    <div className="wrap section">
      <Breadcrumb
        items={[{ label: "Accueil", href: routeFor("accueil") }, { label: "Commande confirmée" }]}
      />
      <h1 className="mt-4 text-display-h2">Merci, votre simulation est terminée</h1>
      <OrderConfirmation
        number={order.number}
        method={order.payment_method}
        paymentStatus={order.payment_status}
        total={order.total_fcfa}
        items={order.items}
      />
      {isSignedIn ? (
        <ClaimOrderButton number={order.number} />
      ) : (
        <Link
          href={`/connexion?redirect=${encodeURIComponent(`/commande/${order.number}/confirmation`)}`}
          className="mt-5 inline-flex min-h-11 items-center underline"
        >
          Connectez-vous pour rattacher cette commande à votre compte
        </Link>
      )}
    </div>
  );
}
