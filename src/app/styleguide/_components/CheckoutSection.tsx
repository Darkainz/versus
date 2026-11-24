import { Field } from "@/components/ui/Field";
import { RadioCard } from "@/components/ui/RadioCard";
import { Stepper } from "@/components/ui/Stepper";
import { StyleguideSection } from "./StyleguideSection";

export function CheckoutSection() {
  return (
    <StyleguideSection
      id="commande"
      eyebrow="10. Commande"
      title="Coordonnées et étapes"
      intro="Primitives du tunnel de commande fictif : champs associés, choix exclusif et progression."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-base font-bold">Stepper · quatre étapes</h3>
          <Stepper steps={["Coordonnées", "Livraison", "Paiement", "Vérification"]} current={1} />
        </div>
        <div className="grid gap-6">
          <Field
            id="styleguide-customer-name"
            label="Nom complet"
            hint="Saisissez le nom à utiliser dans la simulation."
            required
          >
            <input
              id="styleguide-customer-name"
              defaultValue="Ama Mensah"
              className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
            />
          </Field>
          <fieldset className="grid gap-3 border-0 p-0">
            <legend className="mb-1 text-sm font-semibold">RadioCard · moyen de paiement</legend>
            <RadioCard
              name="styleguide-payment"
              value="tmoney"
              title="T-Money"
              description="Simulation mobile money."
              defaultChecked
            />
            <RadioCard
              name="styleguide-payment"
              value="card"
              title="Carte bancaire"
              description="Aucune donnée de carte ne sera demandée."
            />
          </fieldset>
        </div>
      </div>
    </StyleguideSection>
  );
}
