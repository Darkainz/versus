import { timingSafeEqual } from "node:crypto";
import { connection } from "next/server";
import { z } from "zod";
import { checkDatabase } from "@/lib/health";

function isAuthorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(header ?? "");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Tâche quotidienne de Vercel (`vercel.json` → `crons`) : interroge la base pour que le projet
 * Supabase gratuit ne soit pas mis en pause pour inactivité. Vercel envoie
 * `Authorization: Bearer <CRON_SECRET>` ; sans secret configuré (au moins 32 caractères), la route
 * refuse tout (503), et un secret erroné donne 401.
 */
export async function GET(request: Request) {
  await connection();
  const secret = z.string().min(32).safeParse(process.env.CRON_SECRET);
  if (!secret.success) {
    return Response.json({ error: "La tâche planifiée n’est pas configurée." }, { status: 503 });
  }
  if (!isAuthorized(request.headers.get("authorization"), secret.data)) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }
  const db = await checkDatabase();
  return Response.json({ ok: db === "ok", db }, { status: db === "erreur" ? 503 : 200 });
}
