import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useCart } from "@/lib/cart-store";
import CartPage from "@/app/(storefront)/cart/page";

const enzymeTiers = [
  { minQty: 1, priceCentavos: 54800 }, { minQty: 12, priceCentavos: 52000 },
  { minQty: 24, priceCentavos: 44500 }, { minQty: 36, priceCentavos: 39800 },
];
const line = (qty: number) => ({ slug: "bio-enzyme", name: "Bio Enzyme", priceCentavos: 54800, priceTiers: enzymeTiers, qty, image: "/x.png" });
beforeEach(() => useCart.getState().clear());

describe("cart volume feedback", () => {
  it("shows the next-tier nudge when 1 unit away", () => {
    useCart.setState({ items: [line(11)] });
    render(<CartPage />);
    expect(screen.getByText(/add 1 more/i)).toBeInTheDocument();
    expect(screen.getByText(/₱520/)).toBeInTheDocument();
  });
  it("hides the nudge when far from the next break (3+ away)", () => {
    useCart.setState({ items: [line(5)] }); // next break at 12 → 7 away
    render(<CartPage />);
    expect(screen.queryByText(/add .* more →/i)).toBeNull();
  });
  it("free-shipping pending below 4 total units", () => {
    useCart.setState({ items: [line(3)] });
    render(<CartPage />);
    expect(screen.getByText(/more item.*for FREE shipping/i)).toBeInTheDocument();
  });
  it("free-shipping unlocked at 4+ total units", () => {
    useCart.setState({ items: [line(4)] });
    render(<CartPage />);
    expect(screen.getByText(/FREE shipping unlocked/i)).toBeInTheDocument();
  });
});
