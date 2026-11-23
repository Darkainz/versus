import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  connection: vi.fn(),
  cookies: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  supabaseEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:55321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: mocks.redirect,
}));

const { saveProduct } = await import("./admin");

describe("admin Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const client = {
      auth: {
        getClaims: vi.fn().mockResolvedValue({
          data: { claims: { sub: "00000000-0000-4000-8000-000000000099" } },
          error: null,
        }),
      },
      from,
    };
    mocks.createSupabaseServerClient.mockResolvedValue(client);
    mocks.connection.mockResolvedValue(undefined);
    mocks.cookies.mockResolvedValue({ getAll: vi.fn(() => []) });
  });

  it("refuses an authenticated non-admin calling an action directly without redirecting", async () => {
    await expect(saveProduct({ error: null, success: null }, new FormData())).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );

    expect(mocks.notFound).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.createSupabaseServerClient).toHaveBeenCalledTimes(2);
  });
});
