import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddToCart } from "@/components/add-to-cart";
import { useCart } from "@/lib/cart-store";
import { copy } from "@/lib/copy";

beforeEach(() => useCart.getState().clear());

// The card CTA renders copy.addToCart.add ("Idagdag sa Cart") and the detail
// CTA renders copy.addToCart.addWithTotal ("Idagdag sa Cart · ₱…"). Both share
// the same prefix, so an escaped substring regex from `add` finds either.
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ADD_TO_CART_NAME = new RegExp(escapeRegExp(copy.addToCart.add), "i");

const props = {
  slug: "bio-plant-booster",
  name: "Bio Plant Booster",
  priceCentavos: 25000,
  image: "/x.png",
};

describe("AddToCart", () => {
  it("adds one item from a card layout", async () => {
    render(<AddToCart {...props} layout="card" />);
    await userEvent.click(screen.getByRole("button", { name: ADD_TO_CART_NAME }));
    expect(useCart.getState().totalItems()).toBe(1);
  });

  it("adds the chosen quantity from a detail layout", async () => {
    render(<AddToCart {...props} layout="detail" />);
    await userEvent.click(
      screen.getByRole("button", {
        name: copy.addToCart.increaseQuantityAriaLabel,
      })
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: copy.addToCart.increaseQuantityAriaLabel,
      })
    );
    await userEvent.click(screen.getByRole("button", { name: ADD_TO_CART_NAME }));
    expect(useCart.getState().items[0].qty).toBe(3);
  });

  it("never lets quantity drop below 1", async () => {
    render(<AddToCart {...props} layout="detail" />);
    await userEvent.click(
      screen.getByRole("button", {
        name: copy.addToCart.decreaseQuantityAriaLabel,
      })
    );
    await userEvent.click(screen.getByRole("button", { name: ADD_TO_CART_NAME }));
    expect(useCart.getState().items[0].qty).toBe(1);
  });
});
