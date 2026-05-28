import { describe, it, expect } from "vitest";
import { resolveShipping } from "@/lib/shipping";
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
    });
  });
  it("returns the zone fee when enabled and region known", () => {
    expect(resolveShipping(cfg(), "REGION_7")).toEqual({
      showFee: true,
      shippingCentavos: 18000,
    });
  });
  it("returns no fee for an unknown region", () => {
    expect(resolveShipping(cfg(), "ATLANTIS")).toEqual({
      showFee: false,
      shippingCentavos: 0,
    });
  });
  it("falls back to no-fee when the resolved fee is 0", () => {
    expect(
      resolveShipping(cfg({ feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 } }), "NCR")
    ).toEqual({ showFee: false, shippingCentavos: 0 });
  });
});
