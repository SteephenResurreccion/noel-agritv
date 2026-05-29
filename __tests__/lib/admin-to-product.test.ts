import { describe, it, expect } from "vitest";
import { adminToProduct } from "@/lib/admin-to-product";
import type { AdminProduct } from "@/lib/admin-store";

const base: AdminProduct = {
  id: "1",
  slug: "test",
  name: "Test",
  description: "A test product",
  image: "/x.png",
  categorySlug: "seeds",
  visible: true,
};

describe("adminToProduct priceCentavos", () => {
  it("passes through a set price", () => {
    expect(adminToProduct({ ...base, priceCentavos: 25000 }).priceCentavos).toBe(25000);
  });
  it("leaves price undefined when unset", () => {
    expect(adminToProduct(base).priceCentavos).toBeUndefined();
  });
});

describe("adminToProduct priceTiers", () => {
  it("carries priceTiers through to the storefront Product", () => {
    const tiers = [{ minQty: 1, priceCentavos: 57500 }, { minQty: 12, priceCentavos: 54000 }];
    const p = adminToProduct({ ...base, priceCentavos: 57500, priceTiers: tiers });
    expect(p.priceTiers).toEqual(tiers);
  });
  it("leaves priceTiers undefined when unset", () => {
    expect(adminToProduct(base).priceTiers).toBeUndefined();
  });
});
