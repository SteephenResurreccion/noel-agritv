import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Tests the 30-second in-memory cache wrapped around the Sheets READ helper.
 *
 * The module is reloaded between tests with `vi.resetModules()` so the
 * module-scoped cache starts fresh each run.
 *
 * The `google-auth-library` JWT is mocked to short-circuit auth — we only care
 * about the cache + parse logic here, not the credential flow (which mirrors
 * the proven `sheets.ts` exactly).
 */

vi.mock("google-auth-library", () => {
  // Vitest needs an actual class for `new JWT(...)` to work; a plain factory
  // function trips the "not a constructor" guard.
  class FakeJWT {
    constructor(_opts: unknown) {}
    async getAccessToken() {
      return { token: "fake-token" };
    }
  }
  return { JWT: FakeJWT };
});

function fakeSheetResponse(values: string[][]) {
  return new Response(JSON.stringify({ values }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function loadModule() {
  vi.resetModules();
  return import("@/lib/sheets-read");
}

const SAMPLE_ROWS: string[][] = [
  ["Order#", "Timestamp", "Name", "Phone"], // header-ish
  ["NAG-20260521-A7K1", "ts", "Juan", "+639171234567"],
];

describe("fetchAllOrderRows — 30s cache", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_SHEET_ID", "sheet-id-stub");
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL", "stub@example.com");
    vi.stubEnv("GOOGLE_PRIVATE_KEY", "stub-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls Sheets API once and returns the row values", async () => {
    // Typed as a fetch-shape function so `mock.calls[0][0]` is `RequestInfo`
    // rather than the zero-arg `[]` tuple `vi.fn(async () => ...)` infers.
    const fetchMock = vi.fn<(url: string) => Promise<Response>>(async () =>
      fakeSheetResponse(SAMPLE_ROWS)
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    const rows = await fetchAllOrderRows();

    expect(rows).toEqual(SAMPLE_ROWS);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0];
    expect(url).toContain("/values/Orders");
    expect(url).toContain("A:Q");
  });

  it("returns cached rows on a second call within 30 seconds", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T00:00:00Z"));
    const fetchMock = vi.fn(async () => fakeSheetResponse(SAMPLE_ROWS));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    await fetchAllOrderRows();
    // 29 seconds later — still within the window.
    vi.setSystemTime(new Date("2026-05-21T00:00:29Z"));
    await fetchAllOrderRows();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches after the 30 second TTL expires", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T00:00:00Z"));
    const fetchMock = vi.fn(async () => fakeSheetResponse(SAMPLE_ROWS));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    await fetchAllOrderRows();
    // 31 seconds later — past the window.
    vi.setSystemTime(new Date("2026-05-21T00:00:31Z"));
    await fetchAllOrderRows();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when required env vars are missing", async () => {
    vi.unstubAllEnvs();
    const fetchMock = vi.fn(async () => fakeSheetResponse(SAMPLE_ROWS));
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    await expect(fetchAllOrderRows()).rejects.toThrow(
      /Google Sheets env vars/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on non-OK upstream responses", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response("upstream blew up", {
          status: 500,
          headers: { "content-type": "text/plain" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    await expect(fetchAllOrderRows()).rejects.toThrow(/Sheets read failed/);
  });

  it("returns an empty array when the sheet has no values yet", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchAllOrderRows } = await loadModule();
    const rows = await fetchAllOrderRows();
    expect(rows).toEqual([]);
  });
});
