import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const requestSchema = z
  .object({
    tag: z.union([
      z.literal("catalog"),
      z.literal("home"),
      z.string().regex(/^product:[a-z0-9][a-z0-9-]{0,99}$/),
    ]),
  })
  .strict();

function isAuthorized(value: string | null, secret: string): boolean {
  if (!value) return false;
  const provided = Buffer.from(value);
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  const secret = z.string().min(32).safeParse(process.env.REVALIDATE_SECRET);
  if (!secret.success) {
    return Response.json({ error: "La revalidation n’est pas configurée." }, { status: 503 });
  }
  if (!isAuthorized(request.headers.get("x-revalidate-secret"), secret.data)) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Tag de cache invalide." }, { status: 400 });
  }

  revalidateTag(parsed.data.tag, { expire: 0 });
  return Response.json({ revalidated: true, tag: parsed.data.tag });
}
