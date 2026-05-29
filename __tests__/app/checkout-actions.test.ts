import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Security-critical: submitOrder must NEVER trust the client's price snapshot.
 * It re-derives every line's tier price from the authoritative static catalog
 * (src/data/products.ts). A buyer who tampers with priceCentavos/priceTiers on
 * the wire still gets charged the server's tier price.
 *
 * submitOrder's real signature is `submitOrder(payload: unknown)` — it takes a
 * plain parsed object (validated by checkoutSchema), NOT a FormData. The schema
 * requires `consent: true`. We mock every external call the action makes:
 *   - getAdminConfig (Blob)  → customProducts: null ⇒ server falls back to the
 *     static catalog, which carries the real bio-enzyme tier ladder.
 *   - verifyTurnstile        → true
 *   - appendOrderRow (Sheets)→ spy; we assert on the row it receives.
 * The real `products` import (not mocked) supplies the authoritative tiers, and
 * the real `formatCentavos` is used for assertions rather than hardcoded strings.
 */

// vi.hoisted: the mock factory is hoisted above top-level consts, so the spy
// must be created inside a hoisted block to be referenceable from the factory.
const { appendOrderRow } = vi.hoisted(() => ({
  appendOrderRow: vi.fn(async (_row: string[]) => {}),
}));
vi.mock("@/lib/sheets", async (orig) => ({
  ...(await orig<typeof import("@/lib/sheets")>()),
  appendOrderRow,
}));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn(async () => true) }));
vi.mock("@/lib/admin-store", () => ({
  getAdminConfig: vi.fn(async () => ({
    customProducts: null, // ⇒ server falls back to the static catalog (real tiers)
    shipping: { enabled: false, feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 } },
  })),
}));

import { submitOrder } from "@/app/(storefront)/checkout/actions";
import { formatCentavos } from "@/lib/utils";

function payload(items: unknown): unknown {
  return {
    turnstileToken: "x",
    name: "Juan dela Cruz",
    phone: "09171234567",
    region: "REGION_4A", // CALABARZON — Batangas / Lipa City live here
    province: "Batangas",
    city: "Lipa City",
    barangay: "Sabang",
    street: "123 Rizal St",
    consent: true, // checkoutSchema requires z.literal(true)
    items,
  };
}

beforeEach(() => {
  appendOrderRow.mockClear();
});

describe("submitOrder server authority", () => {
  it("recomputes the bulk tier price and ignores a tampered client snapshot", async () => {
    // Client LIES: ₱1 unit price for 12 bio-enzyme. Server must use the ₱520 tier.
    const tampered = [
      {
        slug: "bio-enzyme",
        name: "hacked",
        priceCentavos: 100,
        priceTiers: [{ minQty: 1, priceCentavos: 100 }],
        qty: 12,
        image: "/x.png",
      },
    ];

    const result = await submitOrder(payload(tampered));
    expect(result).toMatchObject({ ok: true });

    expect(appendOrderRow).toHaveBeenCalledTimes(1);
    const row = appendOrderRow.mock.calls[0][0] as string[];

    // items column carries the SERVER unit price (₱520), not the tampered ₱1:
    expect(row.some((c) => c.includes(formatCentavos(52000)))).toBe(true);
    expect(row.some((c) => c.includes(formatCentavos(100)))).toBe(false);

    // subtotal column = 12 * 52000 = 624000:
    expect(row).toContain(formatCentavos(624000));
  });
});
