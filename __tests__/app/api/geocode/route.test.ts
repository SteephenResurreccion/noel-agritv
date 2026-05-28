import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Tests the dev-vs-production rate-limit bypass on `/api/geocode`.
 *
 * The limiter is module-scoped inside the route file. `vi.resetModules()` +
 * dynamic `import()` is the only way to get a fresh limiter per test so the
 * dev/prod cases don't bleed into each other.
 */

function fakeNominatim() {
  // Always-OK fetch — Nominatim payload is forwarded unchanged, so any shape
  // is fine for these tests.
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
  );
}

function makeReq(): NextRequest {
  // The request shares the "unknown" IP bucket because we don't set
  // `x-forwarded-for`. That's the dev scenario the bypass targets.
  return new NextRequest(
    "http://localhost/api/geocode?lat=14.5995&lon=120.9842"
  );
}

async function loadRoute() {
  vi.resetModules();
  return import("@/app/api/geocode/route");
}

function setNodeEnv(value: "production" | "development" | "test") {
  // `vi.stubEnv` is the supported path — direct assignment to NODE_ENV is
  // blocked because the descriptor is locked down to a getter at startup.
  vi.stubEnv("NODE_ENV", value);
}

describe("/api/geocode rate-limit bypass", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fakeNominatim());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does NOT rate-limit consecutive requests in development", async () => {
    setNodeEnv("development");
    const { GET } = await loadRoute();
    const first = await GET(makeReq());
    expect(first.status).toBe(200);
    // A second tap inside 1s would normally 429 (shared "unknown" bucket).
    const second = await GET(makeReq());
    expect(second.status).toBe(200);
    const third = await GET(makeReq());
    expect(third.status).toBe(200);
  });

  it("DOES rate-limit consecutive requests in production", async () => {
    setNodeEnv("production");
    const { GET } = await loadRoute();
    const first = await GET(makeReq());
    expect(first.status).toBe(200);
    // No x-forwarded-for → "unknown" bucket → 1 req/sec rule trips.
    const second = await GET(makeReq());
    expect(second.status).toBe(429);
    const body = (await second.json()) as { error: string };
    expect(body.error).toBe("rate_limited");
  });
});
