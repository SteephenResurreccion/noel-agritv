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

  // Regression: `put(..., { access: "private" })` returns the `.private.` host
  // form, which the admin image-upload flow stores. The store-ID allowlist must
  // accept it or every owner-uploaded product image 403s on the live proxy.
  it("accepts the private store-host form", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        `https://${STORE_ID}.private.blob.vercel-storage.com/products/bio-plant-booster-1775673831867.webp`
      )
    );
    expect(res.status).toBe(200);
    expect(getMock).toHaveBeenCalledWith(
      "products/bio-plant-booster-1775673831867.webp",
      { access: "private" }
    );
  });

  // Security posture preserved: the `.private.` form of a FOREIGN store
  // (different store ID) must still be rejected — the allowlist binds to THIS
  // store, so a cross-tenant private host is not trusted just because it parses.
  it("rejects a foreign .private. store-host (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        "https://attacker-store.private.blob.vercel-storage.com/products/evil.webp"
      )
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  // Path allowlist (red-team R3, CRITICAL): the unauthenticated proxy must NOT
  // stream the private `admin/config.json` (manager emails = PII) that sits at a
  // fixed key in this same store, even though the host check passes.
  it("rejects admin/config.json on the valid store host (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(`https://${STORE_ID}.blob.vercel-storage.com/admin/config.json`)
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("accepts a videos/ path on the valid store host", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(`https://${STORE_ID}.blob.vercel-storage.com/videos/clip.mp4`)
    );
    expect(res.status).toBe(200);
    expect(getMock).toHaveBeenCalledWith("videos/clip.mp4", {
      access: "private",
    });
  });

  it("rejects a non-allowlisted prefix on the valid store host (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(`https://${STORE_ID}.blob.vercel-storage.com/secrets/key.txt`)
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  it("rejects path traversal even under an allowed prefix (403)", async () => {
    const { GET } = await loadRoute();
    const res = await GET(
      makeReq(
        `https://${STORE_ID}.blob.vercel-storage.com/products/../admin/config.json`
      )
    );
    expect(res.status).toBe(403);
    expect(getMock).not.toHaveBeenCalled();
  });

  // Cache-key normalization (rate-abuse-1, fix #3): the proxy only reads `url`.
  // Junk cache-busting params (`&x=<rand>`) must NOT change behaviour or reach
  // get() — they're ignored, so the served blob is identical regardless of noise.
  it("ignores query params other than `url`", async () => {
    const { GET } = await loadRoute();
    const u = new URL("http://localhost/api/blob-image");
    u.searchParams.set(
      "url",
      `https://${STORE_ID}.blob.vercel-storage.com/products/x.png`
    );
    u.searchParams.set("x", "cache-bust-12345");
    u.searchParams.set("download", "1");
    const res = await GET(new NextRequest(u));
    expect(res.status).toBe(200);
    // Same pathname as the no-noise case — the extra params had no effect.
    expect(getMock).toHaveBeenCalledWith("products/x.png", {
      access: "private",
    });
  });
});

/**
 * Egress-abuse safeguard (rate-abuse-1): a per-IP limiter caps how many times
 * the same valid blob can be looped out of metered Blob storage. It only engages
 * in production (matching `/api/geocode`); in dev every request shares the
 * `"unknown"` bucket, which would falsely throttle legitimate multi-image pages.
 *
 * The limiter is module-scoped, so `loadRoute()` (which `vi.resetModules()`s)
 * yields a FRESH limiter per test — these tests reuse a single loaded route so
 * the counter accumulates across calls.
 */
describe("/api/blob-image rate limiting", () => {
  const validUrl = `https://${STORE_ID}.blob.vercel-storage.com/products/x.png`;

  beforeEach(() => {
    vi.stubEnv("BLOB_STORE_ID", STORE_ID);
    getMock.mockReset();
    getMock.mockResolvedValue(okBlobResult());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function makeReqFromIp(ip: string): NextRequest {
    const u = new URL("http://localhost/api/blob-image");
    u.searchParams.set("url", validUrl);
    return new NextRequest(u, { headers: { "x-forwarded-for": ip } });
  }

  it("does NOT rate-limit outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { GET } = await loadRoute();
    // Well past the 60/min cap — every one must still serve in dev.
    for (let i = 0; i < 70; i++) {
      const res = await GET(makeReqFromIp("1.2.3.4"));
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 with Retry-After once an IP exceeds the per-minute cap", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GET } = await loadRoute();
    // 60 allowed, the 61st from the same IP is throttled.
    for (let i = 0; i < 60; i++) {
      const res = await GET(makeReqFromIp("9.9.9.9"));
      expect(res.status).toBe(200);
    }
    const blocked = await GET(makeReqFromIp("9.9.9.9"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    // The throttled request never reaches Blob storage — no egress charged.
    expect(getMock).toHaveBeenCalledTimes(60);
  });

  it("rate-limits per IP — a different IP is unaffected", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { GET } = await loadRoute();
    for (let i = 0; i < 60; i++) {
      await GET(makeReqFromIp("9.9.9.9"));
    }
    expect((await GET(makeReqFromIp("9.9.9.9"))).status).toBe(429);
    // A fresh IP still gets served.
    expect((await GET(makeReqFromIp("8.8.8.8"))).status).toBe(200);
  });
});
