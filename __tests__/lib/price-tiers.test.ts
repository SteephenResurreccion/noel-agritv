import { describe, it, expect } from "vitest";
import { priceTierSchema } from "@/lib/price-tiers";

describe("priceTierSchema", () => {
  it("accepts ascending tiers with first minQty = 1", () => {
    expect(priceTierSchema.safeParse([{ minQty: 1, priceCentavos: 54800 }, { minQty: 12, priceCentavos: 52000 }]).success).toBe(true);
  });
  it("accepts an empty array (no tiers)", () => {
    expect(priceTierSchema.safeParse([]).success).toBe(true);
  });
  it("rejects when the first minQty is not 1", () => {
    expect(priceTierSchema.safeParse([{ minQty: 2, priceCentavos: 54800 }]).success).toBe(false);
  });
  it("rejects non-ascending / duplicate minQty", () => {
    expect(priceTierSchema.safeParse([{ minQty: 1, priceCentavos: 1 }, { minQty: 1, priceCentavos: 2 }]).success).toBe(false);
  });
  it("rejects negative prices", () => {
    expect(priceTierSchema.safeParse([{ minQty: 1, priceCentavos: -5 }]).success).toBe(false);
  });
  it("rejects a price that increases with quantity", () => {
    expect(priceTierSchema.safeParse([{ minQty: 1, priceCentavos: 100 }, { minQty: 12, priceCentavos: 200 }]).success).toBe(false);
  });
  it("accepts equal prices across tiers", () => {
    expect(priceTierSchema.safeParse([{ minQty: 1, priceCentavos: 200 }, { minQty: 12, priceCentavos: 200 }]).success).toBe(true);
  });
});
