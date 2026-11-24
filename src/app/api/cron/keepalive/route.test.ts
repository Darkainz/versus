import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDatabase } from "@/lib/health";
import { GET } from "./route";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("@/lib/health", () => ({ checkDatabase: vi.fn() }));

const secret = "test-cron-secret-with-at-least-32-chars";

function request(authorization?: string) {
  return new Request("http://localhost/api/cron/keepalive", {
    headers: authorization ? { authorization } : {},
  });
}

describe("GET /api/cron/keepalive", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.clearAllMocks();
  });

  it("refuse tout (503) tant que CRON_SECRET n'est pas configuré ou est trop court", async () => {
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(503);
    process.env.CRON_SECRET = "court";
    expect((await GET(request("Bearer court"))).status).toBe(503);
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it("refuse l'absence d'en-tête et un mauvais secret (401) sans toucher à la base", async () => {
    process.env.CRON_SECRET = secret;
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer mauvais"))).status).toBe(401);
    expect((await GET(request(secret))).status).toBe(401);
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it("interroge la base avec le bon secret et signale une base indisponible (503)", async () => {
    process.env.CRON_SECRET = secret;
    vi.mocked(checkDatabase).mockResolvedValueOnce("ok");
    const ok = await GET(request(`Bearer ${secret}`));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ ok: true, db: "ok" });

    vi.mocked(checkDatabase).mockResolvedValueOnce("erreur");
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(503);
  });
});
