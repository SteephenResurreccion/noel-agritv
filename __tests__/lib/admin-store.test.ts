import { describe, it, expect, vi, beforeEach } from "vitest";

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

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({
  get: getMock,
  // put is unused in these tests but must exist for the module import.
  put: vi.fn(),
}));

import { getAdminConfig } from "@/lib/admin-store";

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
