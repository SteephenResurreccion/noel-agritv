import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Guards the request-dedup refactor of `getAdminConfig` (night-audit
 * finding data-fetching-1).
 *
 * `getAdminConfig({})` (non-strict, render reads) is wrapped in React `cache`
 * so the 3-4 identical Blob reads a single page render fires collapse into ONE
 * origin fetch. `getAdminConfig({ strict: true })` (mutation / auth reads) is
 * deliberately NOT routed through that memo.
 *
 * THE INVARIANT THIS FILE PROTECTS — optimistic locking:
 *   Every mutation in admin/actions.ts does
 *     const config = await getAdminConfig({ strict: true });   // read A
 *     ...mutate config in place...
 *     await saveAdminConfig(config, config.version);           // re-reads strict (read B)
 *   Read A and read B happen in the SAME server-action request, bridging the
 *   in-place mutation. If strict reads were memoized, read B would return read
 *   A's already-mutated object, the version re-check would always pass, and
 *   concurrent writes would go undetected (silent data loss). So strict MUST
 *   hit Blob fresh every call.
 *
 * NOTE ON THE NON-STRICT DEDUP: React `cache` only memoizes inside a real
 * server render/request scope, which vitest's node environment does NOT
 * establish — outside that scope `cache()` falls through to the wrapped fn on
 * every call. So the "N non-strict reads → 1 Blob fetch" behavior cannot be
 * unit-asserted here without testing React internals; it is verified by the
 * Next render pass in `npm run build` / production. What IS unit-testable, and
 * what actually prevents the regression, is the strict-never-deduped guarantee
 * below — true by construction regardless of render scope.
 *
 * We mock only `@vercel/blob get` and set the token so the real read path runs.
 */

const h = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  /**
   * Stand-in for the function `unstable_cache` returns. It calls THROUGH to the
   * wrapped origin reader (vitest has no Next request scope, so the real
   * cross-request persistence can't run here — that is exercised by
   * `npm run build`). Letting us assert the wrapper WAS used on non-strict reads
   * and BYPASSED on strict reads is the unit-testable half of the contract.
   */
  cachedReaderSpy: vi.fn(),
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  /**
   * Captures the fn + options handed to `unstable_cache` at module load, so we
   * can prove (1) the cached fn THROWS on failure — a rejected promise is never
   * written to the Data Cache, the no-poison guard — and (2) it is tagged + TTL'd.
   */
  captured: {
    fn: null as null | (() => Promise<unknown>),
    options: null as null | { tags?: string[]; revalidate?: number },
  },
}));

vi.mock("@vercel/blob", () => ({
  get: h.getMock,
  put: h.putMock,
}));

vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: () => Promise<unknown>,
    _keyParts: unknown,
    options: { tags?: string[]; revalidate?: number }
  ) => {
    h.captured.fn = fn;
    h.captured.options = options;
    h.cachedReaderSpy.mockImplementation(() => fn());
    return h.cachedReaderSpy;
  },
  revalidateTag: h.revalidateTagMock,
  revalidatePath: h.revalidatePathMock,
}));

import {
  getAdminConfig,
  saveAdminConfig,
  resolveRoleStrict,
} from "@/lib/admin-store";

/** Alias so the existing tests below keep their concise `getMock` references. */
const getMock = h.getMock;

/** Build a fake `get` result whose stream yields the given config JSON. */
function blobResultFor(config: unknown) {
  return {
    stream: new Response(JSON.stringify(config)).body,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.BLOB_READ_WRITE_TOKEN = "test-token";
});

describe("getAdminConfig — request dedup refactor", () => {
  it("strict reads are NEVER memoized: two strict reads in one tick hit Blob twice with fresh objects (protects optimistic locking)", async () => {
    getMock
      .mockResolvedValueOnce(blobResultFor({ version: 1, managers: [] }))
      .mockResolvedValueOnce(blobResultFor({ version: 2, managers: [] }));

    const a = await getAdminConfig({ strict: true });
    const b = await getAdminConfig({ strict: true });

    // Both calls reached the origin — the second is NOT a memoized copy of the first.
    expect(getMock).toHaveBeenCalledTimes(2);
    // Distinct object instances, so a mutation to `a` cannot poison `b`.
    expect(a).not.toBe(b);
    // The second read sees the live (changed) version, which is exactly what
    // saveAdminConfig's concurrent-write check depends on.
    expect(a.version).toBe(1);
    expect(b.version).toBe(2);
  });

  it("strict read throws on Blob error (mutations must not overwrite with empty config)", async () => {
    getMock.mockRejectedValueOnce(new Error("blob down"));
    await expect(getAdminConfig({ strict: true })).rejects.toThrow("blob down");
  });

  it("non-strict read returns DEFAULT_CONFIG-merged data and swallows Blob errors (safe for render)", async () => {
    getMock.mockResolvedValueOnce(blobResultFor({ version: 5, hiddenProducts: ["a"] }));
    const config = await getAdminConfig();
    expect(config.version).toBe(5);
    expect(config.hiddenProducts).toEqual(["a"]);
    // Field absent in Blob payload falls back to DEFAULT_CONFIG.
    expect(config.shipping).toEqual({
      enabled: false,
      feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
    });
  });

  it("non-strict read returns DEFAULT_CONFIG on Blob error rather than throwing", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    getMock.mockRejectedValueOnce(new Error("blob down"));
    const config = await getAdminConfig();
    expect(config.version).toBe(0);
    expect(config.customProducts).toBeNull();
    errSpy.mockRestore();
  });

  it("missing BLOB token: strict throws, non-strict returns DEFAULT_CONFIG", async () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    await expect(getAdminConfig({ strict: true })).rejects.toThrow(
      "BLOB_READ_WRITE_TOKEN not configured"
    );
    const config = await getAdminConfig();
    expect(config.version).toBe(0);
    expect(getMock).not.toHaveBeenCalled();
  });
});

/**
 * Proves the STRICT resolver actually propagates a Blob outage as a rejection —
 * the premise `resolveRoleWithRetry` (src/lib/auth-role.ts) is built on. The
 * sibling auth-role test mocks `resolveRoleStrict` and asserts the retry/preserve
 * behavior; this block proves the real `resolveRoleStrict` honors the contract
 * those mocks assume, closing the false-confidence gap (the prior wrapper called
 * the swallowing `resolveRole`, which returns null on outage and never rejects,
 * making every catch/retry/preserve branch unreachable in production).
 */
describe("resolveRoleStrict — propagation contract", () => {
  const ORIGINAL_ADMIN_EMAILS = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    // Default: one env owner, distinct from the manager emails under test, so
    // the Blob read path is actually exercised for non-owners.
    process.env.ADMIN_EMAILS = "owner@noelagritv.com";
  });

  afterEach(() => {
    if (ORIGINAL_ADMIN_EMAILS === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = ORIGINAL_ADMIN_EMAILS;
    }
  });

  it("REJECTS when the underlying Blob read fails (outage propagates, not swallowed)", async () => {
    getMock.mockRejectedValueOnce(new Error("blob down"));
    await expect(resolveRoleStrict("manager@noelagritv.com")).rejects.toThrow(
      "blob down"
    );
  });

  it("resolves owner-from-env without touching Blob (outage can never lock an owner out)", async () => {
    const role = await resolveRoleStrict("owner@noelagritv.com");
    expect(role).toBe("owner");
    expect(getMock).not.toHaveBeenCalled();
  });

  it("returns null for an unknown manager on a SUCCESSFUL read (real de-auth, not an outage)", async () => {
    getMock.mockResolvedValueOnce(
      blobResultFor({ version: 3, managers: ["someone@noelagritv.com"] })
    );
    const role = await resolveRoleStrict("nobody@noelagritv.com");
    expect(role).toBeNull();
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it("returns 'manager' for a configured email on a SUCCESSFUL read", async () => {
    getMock.mockResolvedValueOnce(
      blobResultFor({ version: 3, managers: ["manager@noelagritv.com"] })
    );
    const role = await resolveRoleStrict("manager@noelagritv.com");
    expect(role).toBe("manager");
  });
});

/**
 * Guards the cross-request Data Cache (`unstable_cache`) layer added in
 * perf/cacheable-catalog: non-strict render reads are served from Next's Data
 * Cache (one Blob fetch per cache window instead of per render), strict reads
 * stay origin-fresh, and a transient Blob failure must NOT poison the cache.
 */
describe("getAdminConfig — cross-request Data Cache (unstable_cache)", () => {
  it("(a) non-strict read returns merged config VIA the cached wrapper", async () => {
    getMock.mockResolvedValueOnce(
      blobResultFor({ version: 7, hiddenProducts: ["x"] })
    );
    const config = await getAdminConfig();
    // Routed through the unstable_cache wrapper, not a raw origin read.
    expect(h.cachedReaderSpy).toHaveBeenCalledTimes(1);
    expect(config.version).toBe(7);
    expect(config.hiddenProducts).toEqual(["x"]);
    // Still merged over DEFAULT_CONFIG across the cache boundary.
    expect(config.shipping).toEqual({
      enabled: false,
      feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
    });
  });

  it("(b) strict read BYPASSES the cross-request cache (fresh origin every call)", async () => {
    getMock
      .mockResolvedValueOnce(blobResultFor({ version: 1, managers: [] }))
      .mockResolvedValueOnce(blobResultFor({ version: 2, managers: [] }));
    await getAdminConfig({ strict: true });
    await getAdminConfig({ strict: true });
    // Never routed through the Data Cache wrapper...
    expect(h.cachedReaderSpy).not.toHaveBeenCalled();
    // ...and hit the origin fresh both times (premise of optimistic locking).
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it("(c) Blob failure returns DEFAULT_CONFIG and does NOT poison the cache", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // First read fails → caught OUTSIDE the cache wrapper → DEFAULT_CONFIG.
    getMock.mockRejectedValueOnce(new Error("blob blip"));
    const first = await getAdminConfig();
    expect(first.version).toBe(0);

    // Structural no-poison guard: the fn handed to unstable_cache REJECTS on
    // failure (a rejected promise is never written to the Data Cache) — it does
    // NOT resolve to DEFAULT_CONFIG, which would be cacheable.
    expect(h.captured.fn).toBeTypeOf("function");
    getMock.mockRejectedValueOnce(new Error("blob blip"));
    await expect(h.captured.fn!()).rejects.toThrow("blob blip");

    // A subsequent SUCCESSFUL read returns the real config — failure wasn't cached.
    getMock.mockResolvedValueOnce(blobResultFor({ version: 9 }));
    const second = await getAdminConfig();
    expect(second.version).toBe(9);
    errSpy.mockRestore();
  });

  it("is configured with the admin-config tag and a finite backstop TTL", () => {
    expect(h.captured.options).toMatchObject({
      tags: ["admin-config"],
      revalidate: 300,
    });
  });
});

/**
 * Every successful save must invalidate the config Data Cache exactly once so
 * the storefront stops serving the old config; a FAILED write must not (nothing
 * changed → nothing to bust). The exact call shape — `{ expire: 0 }` for
 * immediate read-your-own-write expiration — is asserted because `profile: "max"`
 * (stale-while-revalidate) would show the admin stale config once more.
 */
describe("saveAdminConfig — config-tag invalidation on write", () => {
  function fullConfig() {
    return {
      version: 3,
      hiddenProducts: [],
      videos: null,
      customProducts: null,
      featuredProductIds: [],
      managers: [],
      shipping: {
        enabled: false,
        feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
      },
    };
  }

  it("(d) a successful write invalidates the admin-config tag exactly once", async () => {
    h.putMock.mockResolvedValueOnce(undefined);
    await saveAdminConfig(fullConfig()); // no expectedVersion → no re-read
    expect(h.putMock).toHaveBeenCalledTimes(1);
    expect(h.revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(h.revalidateTagMock).toHaveBeenCalledWith("admin-config", {
      expire: 0,
    });
  });

  it("does NOT invalidate when the Blob write fails (no change → no bust)", async () => {
    h.putMock.mockRejectedValueOnce(new Error("write failed"));
    await expect(saveAdminConfig(fullConfig())).rejects.toThrow("write failed");
    expect(h.revalidateTagMock).not.toHaveBeenCalled();
  });
});
