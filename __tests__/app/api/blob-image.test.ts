import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Tests the SSRF/token-leak hardening on `/api/blob-image` (red-team R1, fix #1).
 *
 * The route must:
 *   - reject a foreign `*.blob.vercel-storage.com` host (cross-tenant / attacker store) → 403
 *   - reject the apex `blob.vercel-storage.com` → 403
 *   - reject non-https → 403
 *   - accept a URL on THIS store's host, and call `get()` with the PATHNAME form
 *     (so the host is reconstructed from the token's store, never attacker-steered).
 *
 * `@vercel/blob`'s `get` is mocked so no real network/token is involved.
 * `vi.resetModules()` + dynamic import gives the route a fresh read of the mock
 * and of `BLOB_STORE_ID` per test (the route reads the env at request time, but
 * resetting keeps tests fully isolated).
 */

const STORE_ID = "store_TESTSTORE123";
const getMock = vi.fn();

vi.mock("@vercel/blob", () => ({
  get: (...args: unknown[]) => getMock(...args),
}));

function makeReq(rawUrl: string): NextRequest {
  const u = new URL("http://localhost/api/blob-image");
  u.searchParams.set("url", rawUrl);
  return new NextRequest(u);
}

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/blob-image/route");
}

function okBlobResult() {
  // Minimal shape matching the route's usage of the get() result.
  return {
    statusCode: 200 as const,
    stream: new ReadableStream(),
    blob: { contentType: "image/png" },
  };
}

describe("/api/blob-image SSRF hardening", () => {
  beforeEach(() => {
    vi.stubEnv("BLOB_STORE_ID", STORE_ID);
    getMock.mockReset();
    getMock.mockResolvedValue(okBlobResult());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a foreign *.blob.vercel-storage.com host (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        "https://attacker-store.blob.vercel-storage.com/products/evil.png"
      )
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("rejects the apex blob.vercel-storage.com (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq("https://blob.vercel-storage.com/products/x.png")
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("rejects a non-https URL (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(`http://${STORE_ID}.blob.vercel-storage.com/products/x.png`)
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("rejects a completely malformed URL (400)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(makeReq("not-a-url"));
    expect(res.status).toBe(400);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("accepts a valid store-host URL and calls get() with the pathname form", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        `https://${STORE_ID}.blob.vercel-storage.com/products/bio-plant-booster-1716900000000.png`
      )
    );
    expect(res.status).toBe(200);
    // Core of the fix: get() is called with the PATHNAME (no leading slash),
    // NOT the attacker-controllable full URL, and with private access.
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(getMock).toHaveBeenCalledWith(
      "products/bio-plant-booster-1716900000000.png",
      { access: "private" }
    );
  });

  it("also accepts the public store-host form", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        `https://${STORE_ID}.public.blob.vercel-storage.com/products/x.png`
      )
    );
    expect(res.status).toBe(200);
    expect(getMock).toHaveBeenCalledWith("products/x.png", {
      access: "private",
    });
  });
});
