import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clients", robots: { index: false, follow: false } };

export default async function AdminClientsPage() {
  await requireAdmin("/admin/clients");
  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("Impossible de charger les clients.", { cause: error });
  return (
    <div className="mt-8">
      <h1 className="text-display-h2">Clients</h1>
      {profiles.length === 0 ? (
        <p className="mt-6 text-muted">Aucun client.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {profiles.map((profile) => (
            <li key={profile.id} className="rounded-card border border-line-soft p-5">
              <p className="font-semibold">{profile.full_name || "Profil incomplet"}</p>
              <p className="mt-1 text-sm text-muted">
                {profile.email ?? "Sans e-mail"} · {profile.phone ?? "Sans téléphone"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
