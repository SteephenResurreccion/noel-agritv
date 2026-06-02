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

// submitOrder now resolves the request language via getLangFromRequest(), which
// reads cookies()/headers() from next/headers — these throw outside a request
// context. Mock them to empty stores so resolution falls through to the "fil"
// default → copyFil → the exact same Filipino messages these assertions expect.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => ({ get: () => null }),
}));

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

// ── Order email notification (spec §4.2 / §8 integration) ────────────────────
// The real after() from next/server does workAsyncStorage.getStore() and throws
// E468 ("`after` was called outside a request scope") under vitest/jsdom — there
// is no Next request context here. Mock it to run the callback inline.
// MUST await cb(): the registered callback is async; a synchronous cb() call
// would only start the promise and assertions would race ahead of
// sendNewOrderEmail. Awaiting settles it before submitOrder resolves.
vi.mock("next/server", () => ({
  after: vi.fn(async (cb: () => void | Promise<void>) => {
    await cb();
  }),
}));

// Spy target for the email assertions. Without this mock the real
// sendNewOrderEmail runs (a silent no-op under unset env vars) and cannot be
// asserted on.
vi.mock("@/lib/notify-email", () => ({
  sendNewOrderEmail: vi.fn().mockResolvedValue(undefined),
}));

import { submitOrder } from "@/app/(storefront)/checkout/actions";
import { formatCentavos } from "@/lib/utils";
import { buildSheetRow, type OrderRowInput } from "@/lib/sheets";
import { sendNewOrderEmail } from "@/lib/notify-email";
import { after } from "next/server";
import { copyFil } from "@/lib/copy";

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
  vi.mocked(after).mockClear();
  vi.mocked(sendNewOrderEmail).mockClear();
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

describe("submitOrder → owner email notification via after() (spec §4.2)", () => {
  // Same valid item shape the existing test uses — server re-derives the real
  // tier price from the static catalog regardless of these client values.
  const items = [
    {
      slug: "bio-enzyme",
      name: "hacked",
      priceCentavos: 100,
      priceTiers: [{ minQty: 1, priceCentavos: 100 }],
      qty: 12,
      image: "/x.png",
    },
  ];

  it("(a)+(b) registers after() exactly once and emails the SAME orderInput the Sheet row was built from", async () => {
    const result = await submitOrder(payload(items));
    expect(result).toMatchObject({ ok: true });

    // (a) after() called exactly once per successful order:
    expect(after).toHaveBeenCalledTimes(1);

    // (b) the email's input rebuilds into EXACTLY the row that was appended —
    // proving both were fed the same orderInput object:
    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    const emailInput = vi.mocked(sendNewOrderEmail).mock
      .calls[0][0] as OrderRowInput;
    const appendedRow = appendOrderRow.mock.calls[0][0] as string[];
    expect(buildSheetRow(emailInput)).toEqual(appendedRow);

    // Spot-check the fields actually came through (guards against an empty
    // object that would also trivially "round-trip"):
    expect(emailInput).toMatchObject({
      name: "Juan dela Cruz",
      phone: "+639171234567",
      province: "Batangas",
      city: "Lipa City",
      barangay: "Sabang",
      street: "123 Rizal St",
    });
    expect(emailInput.orderNumber).toMatch(/^NAG-/);
    expect(emailInput.subtotalCentavos).toBe(624000); // 12 × ₱520 server tier
  });

  it("(c) a rejected email send is swallowed by the after() callback — order still succeeds", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendNewOrderEmail).mockRejectedValueOnce(
      new Error("resend down")
    );

    const result = await submitOrder(payload(items));

    expect(result).toMatchObject({ ok: true });
    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    // The callback's internal try/catch logged it:
    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: failed",
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("does NOT register after() or send email when the Sheets append fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    appendOrderRow.mockRejectedValueOnce(new Error("sheets down"));

    const result = await submitOrder(payload(items));

    expect(result).toMatchObject({ ok: false, error: "sheets" });
    expect(after).not.toHaveBeenCalled();
    expect(sendNewOrderEmail).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("submitOrder rate limiting (finding rate-abuse-3)", () => {
  const items = [
    {
      slug: "bio-enzyme",
      name: "x",
      priceCentavos: 100,
      priceTiers: [{ minQty: 1, priceCentavos: 100 }],
      qty: 12,
      image: "/x.png",
    },
  ];

  it("blocks the 2nd back-to-back submit from the same identifier in production", async () => {
    // The in-process limiter is dev-bypassed (NODE_ENV !== production), so the
    // happy-path tests above never trip it. Force production to exercise the
    // gate. The mocked next/headers returns no x-forwarded-for ⇒ ip "unknown"
    // and the constant phone gives a stable key, so the 1-req/sec interval rule
    // blocks the immediate second submit. Best-effort speed bump only — the real
    // cross-instance ceiling is a Cloudflare WAF rule (see AGENTS.md hardening).
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    try {
      const first = await submitOrder(payload(items));
      expect(first).toMatchObject({ ok: true });

      const second = await submitOrder(payload(items));
      // Surfaced via the "sheets" channel ⇒ Messenger-fallback banner, with the
      // existing localized submitFailed copy (default-lang fil under the mock).
      expect(second).toMatchObject({
        ok: false,
        error: "sheets",
        message: copyFil.errors.submitFailed,
      });
      // The blocked submit never reached the Sheet append:
      expect(appendOrderRow).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        "submitOrder: rate limited",
        expect.anything()
      );
    } finally {
      vi.unstubAllEnvs();
      warnSpy.mockRestore();
    }
  });
});
