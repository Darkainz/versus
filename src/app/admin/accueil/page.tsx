import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HomeSlotForm } from "@/components/admin/HomeSlotForm";

export const metadata: Metadata = { title: "Accueil", robots: { index: false, follow: false } };

export default async function AdminHomePage() {
  await requireAdmin("/admin/accueil");
  const supabase = await createSupabaseServerClient();
  const [{ data: slots, error: slotsError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase.from("home_slots").select("*").order("slot").order("position"),
      supabase.from("products").select("id, name").eq("is_active", true).order("name"),
    ]);
  if (slotsError || productsError) throw new Error("Impossible de charger l’accueil.");
  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Accueil</h1>
      {slots?.length ? (
        <div className="mt-6 grid gap-4">
          {slots.map((slot) => (
            <HomeSlotForm key={slot.id} slot={slot} products={products ?? []} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-muted">Aucun emplacement.</p>
      )}
    </div>
  );
}
