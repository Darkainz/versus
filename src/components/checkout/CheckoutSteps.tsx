import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { RadioCard } from "@/components/ui/RadioCard";
import type { DeliveryZoneOption } from "@/config/policies";

export function CustomerStep() {
  return (
    <div className="grid gap-5">
      <Field id="customer_name" label="Nom complet" required>
        <input
          id="customer_name"
          name="customer_name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
        />
      </Field>
      <Field id="customer_phone" label="Téléphone" hint="Numéro togolais, indicatif +228." required>
        <input
          id="customer_phone"
          name="customer_phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          required
          maxLength={24}
          placeholder="+228 90 12 34 56"
          className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
        />
      </Field>
      <Field id="customer_email" label="E-mail (facultatif)">
        <input
          id="customer_email"
          name="customer_email"
          type="email"
          autoComplete="email"
          maxLength={254}
          className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
        />
      </Field>
    </div>
  );
}

export function DeliveryStep({
  zones,
  selectedZone,
  onZoneChange,
}: {
  zones: readonly DeliveryZoneOption[];
  selectedZone: string;
  onZoneChange: (zone: string) => void;
}) {
  return (
    <div className="grid gap-5">
      <Field id="zone_code" label="Zone de livraison" required>
        <select
          id="zone_code"
          name="zone_code"
          value={selectedZone}
          onChange={(event) => onZoneChange(event.target.value)}
          required
          className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
        >
          <option value="">Choisir une zone</option>
          {zones.map((zone) => (
            <option key={zone.code} value={zone.code}>
              {zone.label} · {zone.eta_label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="city" label="Ville" required>
          <input
            id="city"
            name="city"
            autoComplete="address-level2"
            required
            maxLength={100}
            className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
          />
        </Field>
        <Field id="district" label="Quartier" required>
          <input
            id="district"
            name="district"
            autoComplete="address-level3"
            required
            maxLength={100}
            className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
          />
        </Field>
      </div>
      <Field id="landmark" label="Repère pour la livraison" required>
        <input
          id="landmark"
          name="landmark"
          required
          maxLength={200}
          placeholder="Ex. près de la pharmacie…"
          className="min-h-12 rounded-option border border-line bg-bg px-3 font-normal"
        />
      </Field>
      <Field id="instructions" label="Instructions (facultatif)">
        <textarea
          id="instructions"
          name="instructions"
          maxLength={500}
          rows={3}
          className="rounded-option border border-line bg-bg px-3 py-2 font-normal"
        />
      </Field>
    </div>
  );
}

export function PaymentStep() {
  return (
    <fieldset className="grid gap-3 border-0 p-0">
      <legend className="mb-1 text-sm font-semibold">Choisissez un moyen de paiement</legend>
      <RadioCard
        name="payment_method"
        value="tmoney"
        title="T-Money"
        description="Simulation mobile money, sans débit réel."
        defaultChecked
        required
      />
      <RadioCard
        name="payment_method"
        value="flooz"
        title="Flooz"
        description="Simulation mobile money, sans débit réel."
        required
      />
      <RadioCard
        name="payment_method"
        value="card"
        title="Carte bancaire"
        description="Parcours fictif ; aucune donnée de carte ne sera demandée."
        required
      />
      <RadioCard
        name="payment_method"
        value="cash_on_delivery"
        title="À la livraison"
        description="Disponible pour les commandes jusqu’à 500 000 FCFA."
        required
      />
    </fieldset>
  );
}

export function ReviewStep() {
  return (
    <div className="grid gap-5">
      <p className="text-sm leading-relaxed text-muted">
        VERSUS est un projet pédagogique. Cette commande, ses prix et son paiement sont simulés :
        aucun produit ne sera vendu et aucun paiement réel ne sera effectué.
      </p>
      <Checkbox
        name="fictitious_ack"
        value="on"
        required
        label="J’ai compris qu’il s’agit d’une simulation sans vente ni paiement réel."
      />
    </div>
  );
}
