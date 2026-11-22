import { afterEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { POST } from "./route";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

const secret = "test-revalidation-secret-with-32chars";

function request(body: string, token = secret) {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-revalidate-secret": token } : {}),
    },
    body,
  });
}

describe("POST /api/revalidate", () => {
  afterEach(() => {
    delete process.env.REVALIDATE_SECRET;
    vi.clearAllMocks();
  });

  it("n'invalide que les tags autorisés après authentification", async () => {
    process.env.REVALIDATE_SECRET = secret;
    const response = await POST(request(JSON.stringify({ tag: "product:iphone-18-pro" })));

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("product:iphone-18-pro", { expire: 0 });
  });

  it("refuse un secret incorrect et un tag arbitraire", async () => {
    process.env.REVALIDATE_SECRET = secret;
    expect((await POST(request(JSON.stringify({ tag: "catalog" }), "wrong"))).status).toBe(401);
    expect((await POST(request(JSON.stringify({ tag: "admin-data" })))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("renvoie une erreur explicite quand le secret n'est pas configuré", async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await POST(request(JSON.stringify({ tag: "catalog" })))).status).toBe(503);
  });
});
