import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PaymentSimulator } from "@/components/checkout/PaymentSimulator";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TextLink } from "@/components/ui/TextLink";
import { routeFor } from "@/config/site";
import { getOrderForViewer } from "@/lib/orders/queries";

export const metadata: Metadata = {
  title: "Paiement simulé",
  robots: { index: false, follow: false },
};

export default function PaymentPage({ params }: PageProps<"/commande/[numero]/paiement">) {
  return (
    <Suspense
      fallback={
        <div className="wrap section">
          <h1 className="text-display-h2">Paiement fictif</h1>
          <p role="status" className="mt-4 text-muted">
            Chargement de la commande…
          </p>
        </div>
      }
    >
      <PaymentPageContent params={params} />
    </Suspense>
  );
}

async function PaymentPageContent({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  const order = await getOrderForViewer(numero);
  if (!order) notFound();
  if (order.status === "confirmed") redirect(`/commande/${numero}/confirmation`);

  const cartHref = routeFor("panier");
  const suiviHref = routeFor("suivi");
  return (
    <div className="wrap section">
      <Breadcrumb
        items={[
          { label: "Accueil", href: routeFor("accueil") },
          { label: "Panier", href: cartHref },
          { label: `Commande ${order.number}` },
        ]}
      />
      <h1 className="mt-4 text-display-h2">Paiement fictif</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Commande {order.number}. Toutes les options ci-dessous sont simulées, sans débit réel.
      </p>
      <PaymentSimulator
        number={order.number}
        total={order.total_fcfa}
        paymentMethod={order.payment_method}
        paymentDeadline={order.payment_deadline}
        attempt={order.payment_attempt}
        status={order.status}
      />
      {suiviHref ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          Besoin d’aide ?{" "}
          <TextLink href={suiviHref} prefetch={false} className="text-sm">
            Consultez le suivi de commande
          </TextLink>
          .
        </p>
      ) : null}
    </div>
  );
}
