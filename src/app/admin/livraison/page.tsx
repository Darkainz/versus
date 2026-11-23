import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeliverySettingsForm } from "@/components/admin/DeliverySettingsForm";

export const metadata: Metadata = { title: "Livraison", robots: { index: false, follow: false } };

export default async function AdminDeliveryPage() {
  await requireAdmin("/admin/livraison");
  const supabase = await createSupabaseServerClient();
  const [{ data: zones, error: zonesError }, { data: settings, error: settingsError }] =
    await Promise.all([
      supabase.from("delivery_zones").select("*").order("position"),
      supabase.from("shop_settings").select("*").eq("id", true).maybeSingle(),
    ]);
  if (zonesError || settingsError) throw new Error("Impossible de charger les réglages.");
  if (!settings) throw new Error("Les paramètres de boutique sont absents.");
  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Livraison et paramètres</h1>
      <DeliverySettingsForm zones={zones ?? []} settings={settings} />
    </div>
  );
}
