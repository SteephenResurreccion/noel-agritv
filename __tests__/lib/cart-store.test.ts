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
