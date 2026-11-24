import { connection } from "next/server";
import { checkDatabase } from "@/lib/health";

/**
 * Sonde de santé publique : `200 { status: "ok" }` si la base répond, `503` sinon. Aucune donnée
 * sensible, jamais mise en cache (une sonde figée n'aurait aucun sens).
 */
export async function GET() {
  await connection();
  const db = await checkDatabase();
  const healthy = db === "ok" || db === "non configurée";
  return Response.json(
    { status: healthy ? "ok" : "degraded", db },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
