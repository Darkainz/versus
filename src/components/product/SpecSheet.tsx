import type { ProductSpecs } from "@/lib/catalog/types";

export function SpecSheet({ specs }: { specs: ProductSpecs }) {
  const rows = [
    ["Écran", [specs.screen_size_in ? `${specs.screen_size_in}″` : null, specs.screen_tech]],
    ["Rafraîchissement", specs.refresh_hz ? `${specs.refresh_hz} Hz` : null],
    ["Puce", specs.chip],
    ["Batterie", specs.battery_mah ? `${specs.battery_mah} mAh` : null],
    [
      "Autonomie indicative",
      specs.autonomy_hours
        ? specs.autonomy_hours >= 72
          ? `${Math.round(specs.autonomy_hours / 24)} jours`
          : `${specs.autonomy_hours} h`
        : null,
    ],
    ["Charge", specs.charging_w ? `${specs.charging_w} W` : null],
    ["Appareil photo principal", specs.main_camera_mp ? `${specs.main_camera_mp} Mpx` : null],
    ["Poids", specs.weight_g ? `${specs.weight_g} g` : null],
    ["Étanchéité", specs.ip_rating],
    ["5G", specs.has_5g === undefined ? null : specs.has_5g ? "Oui" : "Non"],
    [
      "Réduction de bruit active",
      specs.has_anc === undefined ? null : specs.has_anc ? "Oui" : "Non",
    ],
  ] as const;

  return (
    <section aria-labelledby="specifications-title" className="mt-12">
      <h2 id="specifications-title" className="text-2xl font-bold">
        Caractéristiques
      </h2>
      <dl className="mt-5 divide-y divide-line-soft border-y border-line-soft">
        {rows.map(([label, values]) => {
          const value = Array.isArray(values) ? values.filter(Boolean).join(" · ") : values;
          return (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-2 sm:gap-6">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="font-medium">{value || "—"}</dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">{specs.specs_note}</p>
    </section>
  );
}
