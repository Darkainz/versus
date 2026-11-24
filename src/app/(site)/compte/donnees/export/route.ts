import { requireUser } from "@/lib/auth/dal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  await requireUser("/compte/donnees");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("export_my_data");
  if (error) {
    console.error("L’export des données personnelles a échoué.", error);
    return Response.json(
      { error: "Impossible de préparer l’export des données." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="versus-donnees-${new Date().toISOString().slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
