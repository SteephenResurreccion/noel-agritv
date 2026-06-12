import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * `revalidateStorefront` path coverage (perf/cacheable-catalog).
 *
 * On top of the cross-request config Data-Cache bust (`revalidateTag` inside
 * `saveAdminConfig`), every storefront-affecting mutation also purges the
 * path/router cache for the pages that read admin config. This was widened from
 * just `/` + `/products` to also cover the dynamic product DETAIL route
 * (`/products/[slug]`, which needs the `'page'` type arg) and `/checkout`
 * (renders shipping fees). We exercise the wiring through a real action.
 *
 * Mocks mirror admin-audit.test.ts: admin-store + auth + blob + after + audit
 * are stubbed so the action runs to its revalidate calls, and next/cache's
 * `revalidatePath` is a spy we assert on.
 */

vi.mock("@/lib/audit", () => ({ appendAuditLog: vi.fn(async () => {}) }));

vi.mock("next/server", () => ({
  after: vi.fn(async (cb: () => void | Promise<void>) => {
    await cb();
  }),
}));

vi.mock("@vercel/blob", () => ({ put: vi.fn(async () => ({ url: "x" })) }));

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

const { revalidatePath } = vi.hoisted(() => ({ revalidatePath: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));

import { toggleProductVisibility } from "@/app/(admin)/admin/actions";

beforeEach(() => {
  revalidatePath.mockClear();
});

describe("revalidateStorefront — widened path coverage", () => {
  it("(e) a storefront-affecting mutation revalidates home, list, product detail (page), and checkout", async () => {
    await toggleProductVisibility("bio-x");
    const calls = revalidatePath.mock.calls;
    expect(calls).toContainEqual(["/"]);
    expect(calls).toContainEqual(["/products"]);
    // Dynamic route → MUST pass the 'page' type arg AND the route-group path
    // (registered as "/(storefront)/products/[slug]/page") or the call is a no-op.
    expect(calls).toContainEqual(["/(storefront)/products/[slug]", "page"]);
    // Checkout renders shipping fees from admin config.
    expect(calls).toContainEqual(["/checkout"]);
  });
});
