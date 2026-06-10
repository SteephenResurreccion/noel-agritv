import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuditEntry } from "@/lib/audit";

/**
 * Action-level audit wiring. Every admin mutation must append exactly one audit
 * row AFTER its config save succeeds, and NEVER on a failed/early-returning
 * mutation. We mock every external dependency of the server-action module:
 *   - `@/lib/audit appendAuditLog` → spy; assert the entry it receives.
 *   - `next/server after`          → run the callback inline (the real after()
 *     throws outside a request scope — see checkout-actions.test.ts). Awaiting
 *     cb() settles the async append before assertions.
 *   - `@/auth auth()`              → owner session so requireAuth/requireOwner pass.
 *   - `@/lib/admin-store`          → getAdminConfig / saveAdminConfig / getOwnerEmails.
 *   - `@vercel/blob put`           → no-op (no image uploads in these tests).
 *   - `next/cache revalidatePath`  → no-op.
 */

const { appendAuditLog } = vi.hoisted(() => ({
  // Typed call signature (so mock.calls[0][0] is AuditEntry) with a zero-arg
  // impl (so there is no unused-param lint warning).
  appendAuditLog: vi.fn<(e: AuditEntry) => Promise<void>>(async () => {}),
}));
vi.mock("@/lib/audit", () => ({ appendAuditLog }));

vi.mock("next/server", () => ({
  after: vi.fn(async (cb: () => void | Promise<void>) => {
    await cb();
  }),
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async () => ({
    url: "https://store_TEST.blob.vercel-storage.com/x.jpg",
  })),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { email: "owner@example.com", role: "owner" },
  })),
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
  saveAdminConfig: vi.fn(async () => {}),
  getOwnerEmails: vi.fn(() => ["owner@example.com"]),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  addProduct,
  removeProduct,
  toggleCustomProductVisibility,
  removeVideo,
  moveVideo,
  saveShippingConfig,
  addManager,
} from "@/app/(admin)/admin/actions";
import { getAdminConfig, saveAdminConfig } from "@/lib/admin-store";

interface MockConfig {
  version: number;
  hiddenProducts: string[];
  videos: unknown[] | null;
  customProducts: unknown[] | null;
  featuredProductIds: string[];
  managers: string[];
  shipping: {
    enabled: boolean;
    feesCentavos: { ncr: number; luzon: number; visayas: number; mindanao: number };
  };
}

function baseConfig(overrides: Partial<MockConfig> = {}): MockConfig {
  return {
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
    ...overrides,
  };
}

function product(over: Record<string, unknown> = {}) {
  return {
    id: "p1",
    slug: "bio-x",
    name: "Bio X",
    description: "desc",
    image: "/x.png",
    categorySlug: "fertilizers",
    visible: true,
    ...over,
  };
}

function video(over: Record<string, unknown> = {}) {
  return {
    id: "v1",
    title: "Harvest Demo",
    href: "https://youtu.be/abc",
    thumbnail: "/t.png",
    visible: true,
    ...over,
  };
}

function productFormData(name: string): FormData {
  const fd = new FormData();
  fd.set("name", name);
  fd.set("description", "A fine product.");
  fd.set("categorySlug", "fertilizers");
  // No image field → size 0 → no blob upload.
  return fd;
}

beforeEach(() => {
  appendAuditLog.mockClear();
  vi.mocked(saveAdminConfig).mockClear();
  vi.mocked(saveAdminConfig).mockResolvedValue(undefined);
  vi.mocked(getAdminConfig).mockClear();
});

describe("admin audit wiring — success logs one entry", () => {
  it("addProduct logs PRODUCT_ADD with actor, slug target, and named summary", async () => {
    await addProduct(productFormData("Test Product"));
    expect(appendAuditLog).toHaveBeenCalledTimes(1);
    expect(appendAuditLog).toHaveBeenCalledWith({
      actor: "owner@example.com",
      action: "PRODUCT_ADD",
      target: "test-product",
      summary: "Added product 'Test Product' (test-product)",
    });
  });

  it("removeProduct resolves the name BEFORE deletion for a readable summary", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      baseConfig({ customProducts: [product()] }) as never
    );
    await removeProduct("p1");
    expect(appendAuditLog).toHaveBeenCalledWith({
      actor: "owner@example.com",
      action: "PRODUCT_REMOVE",
      target: "bio-x",
      summary: "Removed product 'Bio X' (bio-x)",
    });
  });

  it("toggleCustomProductVisibility logs the resulting state (visible→Hid)", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      baseConfig({ customProducts: [product({ visible: true })] }) as never
    );
    await toggleCustomProductVisibility("p1");
    expect(appendAuditLog).toHaveBeenCalledWith({
      actor: "owner@example.com",
      action: "PRODUCT_CUSTOM_VISIBILITY",
      target: "bio-x",
      summary: "Hid product 'Bio X'",
    });
  });

  it("removeVideo resolves the title BEFORE deletion (target = href)", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      baseConfig({ videos: [video()] }) as never
    );
    await removeVideo("v1");
    expect(appendAuditLog).toHaveBeenCalledWith({
      actor: "owner@example.com",
      action: "VIDEO_REMOVE",
      target: "https://youtu.be/abc",
      summary: "Removed video 'Harvest Demo'",
    });
  });

  it("saveShippingConfig (owner) logs SHIPPING_SAVE with formatted fees", async () => {
    await saveShippingConfig({
      enabled: true,
      feesCentavos: { ncr: 12000, luzon: 15000, visayas: 18000, mindanao: 20000 },
    });
    expect(appendAuditLog).toHaveBeenCalledTimes(1);
    const entry = appendAuditLog.mock.calls[0][0];
    expect(entry.actor).toBe("owner@example.com");
    expect(entry.action).toBe("SHIPPING_SAVE");
    expect(entry.summary).toContain("enabled");
    expect(entry.summary).toContain("NCR ₱120");
    expect(entry.summary).toContain("Mindanao ₱200");
  });

  it("addManager (owner) logs MANAGER_ADD", async () => {
    await addManager("manager2@example.com");
    expect(appendAuditLog).toHaveBeenCalledWith({
      actor: "owner@example.com",
      action: "MANAGER_ADD",
      target: "manager2@example.com",
      summary: "Added manager manager2@example.com",
    });
  });
});

describe("admin audit wiring — failed/early-return mutations never log", () => {
  it("does NOT log when the config save rejects (addProduct)", async () => {
    vi.mocked(saveAdminConfig).mockRejectedValueOnce(new Error("blob down"));
    await expect(addProduct(productFormData("Test Product"))).rejects.toThrow();
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("does NOT log (or save) when moveVideo hits an out-of-bounds early return", async () => {
    vi.mocked(getAdminConfig).mockResolvedValueOnce(
      baseConfig({ videos: [video({ id: "v1" })] }) as never
    );
    await moveVideo("v1", "up"); // single video, idx 0, up → returns before save
    expect(saveAdminConfig).not.toHaveBeenCalled();
    expect(appendAuditLog).not.toHaveBeenCalled();
  });

  it("does NOT log when saveShippingConfig input fails validation", async () => {
    await expect(
      saveShippingConfig({
        enabled: true,
        feesCentavos: { ncr: -1, luzon: 0, visayas: 0, mindanao: 0 },
      } as never)
    ).rejects.toThrow();
    expect(appendAuditLog).not.toHaveBeenCalled();
  });
});

describe("admin audit wiring — an audit-append failure never fails the mutation", () => {
  it("swallows a rejected appendAuditLog and logs it tagged [audit]", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    appendAuditLog.mockRejectedValueOnce(new Error("audit sheet down"));

    // The mutation must still succeed (no throw) — audit is best-effort.
    await expect(
      addProduct(productFormData("Test Product"))
    ).resolves.toBeUndefined();
    // Flush the after() callback's microtask so its catch runs before asserting.
    await new Promise((r) => setTimeout(r, 0));

    expect(appendAuditLog).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      "[audit] PRODUCT_ADD append failed:",
      expect.anything()
    );
    errorSpy.mockRestore();
  });
});
