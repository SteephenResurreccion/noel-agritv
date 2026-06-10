import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Upload path-traversal hardening (red-team R2, fix #1).
 *
 * Before the fix, the blob key extension was taken RAW from the
 * attacker-controlled upload filename via `imageFile.name.split(".").pop()`,
 * with `addRandomSuffix:false, allowOverwrite:true`. `@vercel/blob` only
 * rejects the literal substring `//`, so a filename like
 * `x.jpg/../../admin/config.json` produced a key that traverses out of
 * `products/` and could overwrite the admin config.
 *
 * The fix derives the extension from the already-validated MIME type (NEVER
 * from `file.name`) and sets `addRandomSuffix:true` so a key can never collide
 * with or overwrite `admin/config.json`.
 *
 * We mock every external dependency of the server-action module:
 *   - `@vercel/blob put`     → spy capturing the pathname argument; returns a
 *                              fake `{ url }` so we can assert the stored image
 *                              URL is whatever put() returned (display works).
 *   - `@/auth auth()`        → returns a session with a role so requireAuth passes.
 *   - `@/lib/admin-store`    → getAdminConfig / saveAdminConfig stubs.
 *   - `next/cache`           → revalidatePath no-op.
 */

const { putMock, savedConfig } = vi.hoisted(() => ({
  putMock: vi.fn(async (_pathname: string, _body: unknown, _opts: unknown) => ({
    url: "https://store_TEST.blob.vercel-storage.com/products/SAFE-RANDOM.jpg",
  })),
  savedConfig: { current: null as unknown },
}));

vi.mock("@vercel/blob", () => ({
  put: putMock,
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { email: "owner@example.com", role: "owner" } })),
}));

vi.mock("@/lib/admin-store", () => ({
  getAdminConfig: vi.fn(async () => ({
    version: 1,
    hiddenProducts: [],
    videos: null,
    customProducts: [],
    featuredProductIds: [],
    managers: [],
    shipping: {
      enabled: false,
      feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
    },
  })),
  saveAdminConfig: vi.fn(async (config: unknown) => {
    savedConfig.current = config;
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// addProduct/saveFeaturedOrder now schedule an audit-log append via after()
// from next/server, which throws outside a request scope under vitest. Mock it
// as a no-op (this suite asserts upload/validation behaviour, not audit) so the
// callback is never invoked and the real appendAuditLog is never reached.
vi.mock("next/server", () => ({
  after: vi.fn(),
}));

import { addProduct, saveFeaturedOrder } from "@/app/(admin)/admin/actions";
import { getAdminConfig } from "@/lib/admin-store";

/**
 * Build a FormData carrying a malicious-named image file whose extension would
 * traverse out of `products/` if derived from the filename, but whose MIME type
 * is a legitimate `image/jpeg`.
 */
function maliciousFormData(fileName: string, type: string): FormData {
  const fd = new FormData();
  fd.set("name", "Evil Product");
  fd.set("description", "A product whose image filename is hostile.");
  fd.set("categorySlug", "fertilizers");
  const file = new File(["fake-image-bytes"], fileName, { type });
  fd.set("image", file);
  return fd;
}

beforeEach(() => {
  putMock.mockClear();
  savedConfig.current = null;
});

describe("addProduct upload path-traversal hardening", () => {
  it("derives a safe blob key from the MIME type, not the traversal filename", async () => {
    await addProduct(
      maliciousFormData("x.jpg/../../admin/config.json", "image/jpeg")
    );

    expect(putMock).toHaveBeenCalledTimes(1);
    const [pathname, , opts] = putMock.mock.calls[0] as [
      string,
      unknown,
      Record<string, unknown>,
    ];

    // Key is under products/ and has the whitelisted .jpg extension...
    expect(pathname.startsWith("products/")).toBe(true);
    expect(pathname.endsWith(".jpg")).toBe(true);
    // ...and contains NONE of the attacker's traversal payload.
    expect(pathname).not.toContain("..");
    expect(pathname).not.toContain("admin/config.json");
    expect(pathname).not.toContain("config.json");

    // addRandomSuffix must be true so a key can never overwrite admin/config.json.
    expect(opts.addRandomSuffix).toBe(true);
    // allowOverwrite must NOT be re-enabled.
    expect(opts.allowOverwrite).toBeUndefined();
  });

  it("maps each allowed MIME type to its fixed extension, ignoring the filename", async () => {
    const cases: Array<[string, string]> = [
      ["image/jpeg", ".jpg"],
      ["image/png", ".png"],
      ["image/webp", ".webp"],
      ["image/avif", ".avif"],
      ["image/gif", ".gif"],
    ];
    for (const [type, expectedExt] of cases) {
      putMock.mockClear();
      // Filename lies about being a .exe — extension must come from the type.
      await addProduct(maliciousFormData("payload.exe", type));
      const pathname = putMock.mock.calls[0][0] as string;
      expect(pathname.endsWith(expectedExt)).toBe(true);
      expect(pathname).not.toContain(".exe");
    }
  });

  it("stores the URL returned by put() so the image still displays", async () => {
    await addProduct(
      maliciousFormData("x.jpg/../../admin/config.json", "image/jpeg")
    );
    const config = savedConfig.current as {
      customProducts: Array<{ image: string }>;
    };
    const added = config.customProducts[config.customProducts.length - 1];
    // The stored image is the blob-image proxy wrapping the URL put() returned.
    expect(added.image).toContain(
      encodeURIComponent(
        "https://store_TEST.blob.vercel-storage.com/products/SAFE-RANDOM.jpg"
      )
    );
    expect(added.image.startsWith("/api/blob-image?url=")).toBe(true);
  });

  it("rejects a disallowed MIME type without calling put()", async () => {
    // addProduct swallows errors and re-throws a generic message; the key
    // assertion is that no blob write happens for a bad type.
    await expect(
      addProduct(maliciousFormData("x.svg", "image/svg+xml"))
    ).rejects.toThrow();
    expect(putMock).not.toHaveBeenCalled();
  });
});

/**
 * saveFeaturedOrder input-validation hardening (server-actions-2).
 *
 * Before the fix, saveFeaturedOrder wrote the client-supplied string[] straight
 * to admin/config.json with no Zod and no caps, letting an authenticated admin
 * bloat the config Blob (read on every storefront render) with a huge array of
 * arbitrary long strings. The fix validates with a length-capped Zod schema
 * (mirroring saveVideos) and then keeps only known product IDs, deduped.
 */
function configWithProducts(ids: string[]) {
  return {
    version: 1,
    hiddenProducts: [],
    videos: null,
    customProducts: ids.map((id) => ({ id })),
    featuredProductIds: [],
    managers: [],
    shipping: {
      enabled: false,
      feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
    },
  };
}

describe("saveFeaturedOrder input validation", () => {
  it("rejects an oversized array without persisting", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      configWithProducts(["a", "b"]) as never
    );
    const tooMany = Array.from({ length: 51 }, (_, i) => `p${i}`);
    await expect(saveFeaturedOrder(tooMany)).rejects.toThrow();
    // The catch re-throws a generic message; nothing should have been saved.
    expect(savedConfig.current).toBe(null);
  });

  it("rejects an over-long ID string without persisting", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      configWithProducts(["a"]) as never
    );
    await expect(saveFeaturedOrder(["x".repeat(101)])).rejects.toThrow();
    expect(savedConfig.current).toBe(null);
  });

  it("persists only known product IDs, deduped, dropping unknowns", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      configWithProducts(["a", "b", "c"]) as never
    );
    // "ghost" is not a known product; "a" appears twice.
    await saveFeaturedOrder(["b", "ghost", "a", "a"]);
    const saved = savedConfig.current as { featuredProductIds: string[] };
    expect(saved.featuredProductIds).toEqual(["b", "a"]);
  });
});
