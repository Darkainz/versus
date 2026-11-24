import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDatabase } from "@/lib/health";
import { GET } from "./route";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/health", () => ({ checkDatabase: vi.fn() }));

describe("GET /api/health", () => {
  afterEach(() => vi.clearAllMocks());

  it("répond 200 sans cache quand la base répond", async () => {
    vi.mocked(checkDatabase).mockResolvedValueOnce("ok");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok", db: "ok" });
  });

  it("répond 503 quand la base est en erreur, sans détail", async () => {
    vi.mocked(checkDatabase).mockResolvedValueOnce("erreur");
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "degraded", db: "erreur" });
  });

  it("reste vert sans Supabase configuré (catalogue local)", async () => {
    vi.mocked(checkDatabase).mockResolvedValueOnce("non configurée");
    expect((await GET()).status).toBe(200);
  });
});
