import { describe, it, expect } from "vitest";
import { priceForQuantity, nextTierInfo, type TieredPricing } from "@/lib/pricing";

const enzyme: TieredPricing = {
  priceCentavos: 54800,
  priceTiers: [
    { minQty: 1, priceCentavos: 54800 },
    { minQty: 12, priceCentavos: 52000 },
    { minQty: 24, priceCentavos: 44500 },
    { minQty: 36, priceCentavos: 39800 },
  ],
};

describe("priceForQuantity", () => {
  it("returns the highest tier whose minQty <= qty (boundaries)", () => {
    expect(priceForQuantity(enzyme, 1)).toBe(54800);
    expect(priceForQuantity(enzyme, 11)).toBe(54800);
    expect(priceForQuantity(enzyme, 12)).toBe(52000);
    expect(priceForQuantity(enzyme, 23)).toBe(52000);
    expect(priceForQuantity(enzyme, 24)).toBe(44500);
    expect(priceForQuantity(enzyme, 35)).toBe(44500);
    expect(priceForQuantity(enzyme, 36)).toBe(39800);
    expect(priceForQuantity(enzyme, 500)).toBe(39800);
  });
  it("falls back to base price when there are no tiers", () => {
    expect(priceForQuantity({ priceCentavos: 12345 }, 50)).toBe(12345);
  });
  it("handles a single tier", () => {
    expect(priceForQuantity({ priceCentavos: 999, priceTiers: [{ minQty: 1, priceCentavos: 999 }] }, 10)).toBe(999);
  });
  it("returns undefined for inquiry-only (no base, no tiers)", () => {
    expect(priceForQuantity({}, 3)).toBeUndefined();
  });
});

describe("nextTierInfo", () => {
  it("reports units to the next cheaper tier", () => {
    expect(nextTierInfo(enzyme, 11)).toEqual({ unitsToNext: 1, nextPriceCentavos: 52000 });
    expect(nextTierInfo(enzyme, 12)).toEqual({ unitsToNext: 12, nextPriceCentavos: 44500 });
    expect(nextTierInfo(enzyme, 23)).toEqual({ unitsToNext: 1, nextPriceCentavos: 44500 });
  });
  it("returns null at the top tier", () => {
    expect(nextTierInfo(enzyme, 36)).toBeNull();
    expect(nextTierInfo(enzyme, 100)).toBeNull();
  });
  it("returns null when there are no tiers", () => {
    expect(nextTierInfo({ priceCentavos: 1000 }, 5)).toBeNull();
  });
});
