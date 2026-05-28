import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCart } from "@/components/add-to-cart";
import { useCart } from "@/lib/cart-store";

beforeEach(() => useCart.getState().clear());

const props = {
  slug: "bio-plant-booster",
  name: "Bio Plant Booster",
  priceCentavos: 25000,
  image: "/x.png",
};

describe("AddToCart", () => {
  it("adds one item from a card layout", async () => {
    render(<AddToCart {...props} layout="card" />);
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(useCart.getState().totalItems()).toBe(1);
  });

  it("adds the chosen quantity from a detail layout", async () => {
    render(<AddToCart {...props} layout="detail" />);
    await userEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    await userEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(useCart.getState().items[0].qty).toBe(3);
  });

  it("never lets quantity drop below 1", async () => {
    render(<AddToCart {...props} layout="detail" />);
    await userEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
    await userEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(useCart.getState().items[0].qty).toBe(1);
  });
});
