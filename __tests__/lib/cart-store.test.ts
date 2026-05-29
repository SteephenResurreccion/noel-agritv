import { describe, it, expect, beforeEach } from "vitest";
import { useCart, computeSubtotalCentavos, type CartItem } from "@/lib/cart-store";

const item = (over: Partial<CartItem> = {}): Omit<CartItem, "qty"> => ({
  slug: "bio-plant-booster",
  name: "Bio Plant Booster",
  priceCentavos: 25000,
  image: "/x.png",
  ...over,
});

describe("computeSubtotalCentavos", () => {
  it("sums price × qty across lines", () => {
    expect(
      computeSubtotalCentavos([
        { ...item(), qty: 2 },
        { ...item({ slug: "bio-enzyme", priceCentavos: 15000 }), qty: 1 },
      ])
    ).toBe(65000);
  });
  it("is zero for empty cart", () => {
    expect(computeSubtotalCentavos([])).toBe(0);
  });
});

describe("computeSubtotalCentavos with tiers", () => {
  const TIERS = [
    { minQty: 1, priceCentavos: 54800 },
    { minQty: 12, priceCentavos: 52000 },
    { minQty: 24, priceCentavos: 44500 },
  ];
  it("applies the per-line tier price for that line's qty", () => {
    expect(
      computeSubtotalCentavos([
        { slug: "bio-enzyme", name: "Bio Enzyme", priceCentavos: 54800, priceTiers: TIERS, qty: 12, image: "/x.png" },
      ]),
    ).toBe(12 * 52000);
  });
  it("judges tiers per-product in a mixed cart, not by total units", () => {
    expect(
      computeSubtotalCentavos([
        { slug: "bio-enzyme", name: "Bio Enzyme", priceCentavos: 54800, priceTiers: TIERS, qty: 2, image: "/x.png" },
        { slug: "bio-plant-booster", name: "Bio Plant Booster", priceCentavos: 57500, priceTiers: [{ minQty: 1, priceCentavos: 57500 }, { minQty: 12, priceCentavos: 54000 }], qty: 2, image: "/x.png" },
      ]),
    ).toBe(2 * 54800 + 2 * 57500);
  });
  it("falls back to flat price for a line with no tiers (old persisted carts)", () => {
    expect(
      computeSubtotalCentavos([
        { slug: "legacy", name: "Legacy", priceCentavos: 30000, qty: 3, image: "/x.png" },
      ]),
    ).toBe(90000);
  });
});

describe("useCart store", () => {
  beforeEach(() => useCart.getState().clear());

  it("adds a new item with default qty 1", () => {
    useCart.getState().addItem(item());
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().totalItems()).toBe(1);
  });
  it("increments qty when the same slug is added again", () => {
    useCart.getState().addItem(item());
    useCart.getState().addItem(item(), 2);
    expect(useCart.getState().items[0].qty).toBe(3);
  });
  it("caps qty at 99", () => {
    useCart.getState().addItem(item(), 100);
    expect(useCart.getState().items[0].qty).toBe(99);
  });
  it("setQty to 0 removes the line", () => {
    useCart.getState().addItem(item());
    useCart.getState().setQty("bio-plant-booster", 0);
    expect(useCart.getState().items).toHaveLength(0);
  });
  it("setQty clamps to 1..99", () => {
    useCart.getState().addItem(item());
    useCart.getState().setQty("bio-plant-booster", 150);
    expect(useCart.getState().items[0].qty).toBe(99);
  });
  it("subtotalCentavos reflects items", () => {
    useCart.getState().addItem(item(), 2); // 2 × 25000
    expect(useCart.getState().subtotalCentavos()).toBe(50000);
  });
  it("clear empties the cart", () => {
    useCart.getState().addItem(item());
    useCart.getState().clear();
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("persists items to localStorage under the noel-cart key", () => {
    useCart.getState().addItem(item(), 2);
    const raw = localStorage.getItem("noel-cart");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw as string);
    // zustand persist envelope: { state: { items: [...] }, version }
    expect(persisted.state.items).toHaveLength(1);
    expect(persisted.state.items[0].slug).toBe("bio-plant-booster");
    expect(persisted.state.items[0].qty).toBe(2);
  });
});
