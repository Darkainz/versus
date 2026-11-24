import type { Metadata } from "next";
import { OrderTrackingForm } from "@/components/checkout/OrderTrackingForm";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
};

export default function OrderTrackingPage() {
  return (
    <div className="wrap section">
      <h1 className="text-display-h2">Suivre une commande</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Saisissez le numéro de commande et le téléphone indiqué lors de la simulation.
      </p>
      <OrderTrackingForm />
    </div>
  );
}
