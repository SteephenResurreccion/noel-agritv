import { describe, it, expect } from "vitest";
import { resolveShipping, FREE_SHIPPING_MIN_UNITS } from "@/lib/shipping";
import type { ShippingConfig } from "@/lib/admin-store";

const cfg = (over: Partial<ShippingConfig> = {}): ShippingConfig => ({
  enabled: true,
  feesCentavos: { ncr: 9000, luzon: 12000, visayas: 18000, mindanao: 20000 },
  ...over,
});

describe("resolveShipping", () => {
  it("returns no fee when shipping is disabled", () => {
    expect(resolveShipping(cfg({ enabled: false }), "NCR")).toEqual({
      showFee: false,
      shippingCentavos: 0,
      free: false,
    });
  });
  it("returns the zone fee when enabled and region known", () => {
    expect(resolveShipping(cfg(), "REGION_7")).toEqual({
      showFee: true,
      shippingCentavos: 18000,
      free: false,
    });
  });
  it("returns no fee for an unknown region", () => {
    expect(resolveShipping(cfg(), "ATLANTIS")).toEqual({
      showFee: false,
      shippingCentavos: 0,
      free: false,
    });
  });
  it("falls back to no-fee when the resolved fee is 0", () => {
    expect(
      resolveShipping(cfg({ feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 } }), "NCR")
    ).toEqual({ showFee: false, shippingCentavos: 0, free: false });
  });
});

describe("resolveShipping free-shipping threshold", () => {
  // The free-shipping check runs BEFORE region resolution, so the region value
  // is irrelevant to these threshold tests.
  it("is NOT free below the threshold", () => {
    expect(
      resolveShipping(cfg({ enabled: false }), "NCR", FREE_SHIPPING_MIN_UNITS - 1).free
    ).toBe(false);
  });
  it("is FREE at/above the threshold, overriding any region fee", () => {
    const r = resolveShipping(cfg(), "NCR", FREE_SHIPPING_MIN_UNITS);
    expect(r.free).toBe(true);
    expect(r.showFee).toBe(false);
    expect(r.shippingCentavos).toBe(0);
  });
  it("ignores units when not provided (back-compat 2-arg call)", () => {
    expect(resolveShipping(cfg({ enabled: false }), "NCR").free).toBe(false);
  });
});
