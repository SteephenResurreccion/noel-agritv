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
