import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithLang as render, screen } from "../test-utils";
import { useCart } from "@/lib/cart-store";
import CartPage from "@/app/(storefront)/cart/page";
import { copy } from "@/lib/copy";

// The render wrapper (renderWithLang) mounts LangProvider, which calls
// useRouter() on every render — stub it so the App Router context isn't required.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

// The nudge text ("Magdagdag pa ng N") is split across child nodes inside one
// <p>, so a plain getByText(string) misses it. This matcher targets the single
// closest-containing element: its own textContent includes the nudge, but none
// of its element children's does — which uniquely selects the nudge <p>.
const nudgeMatcher = (nudge: string) => (_: string, el: Element | null) => {
  if (!el) return false;
  const has = (n: Element | null) => (n?.textContent ?? "").includes(nudge);
  return has(el) && !Array.from(el.children).some(has);
};

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
    expect(
      screen.getByText(nudgeMatcher(copy.cart.nudge(1)))
    ).toBeInTheDocument();
    expect(screen.getByText(/₱520/)).toBeInTheDocument();
  });
  it("shows the next-tier nudge at the inclusive boundary (2 units away)", () => {
    useCart.setState({ items: [line(10)] }); // next break at 12 → unitsToNext = 2
    render(<CartPage />);
    expect(
      screen.getByText(nudgeMatcher(copy.cart.nudge(2)))
    ).toBeInTheDocument();
    expect(screen.getByText(/₱520/)).toBeInTheDocument();
  });
  it("hides the nudge when far from the next break (3+ away)", () => {
    useCart.setState({ items: [line(5)] }); // next break at 12 → 7 away
    render(<CartPage />);
    // The next-tier nudge ("Magdagdag pa ng N…") must not render this far out.
    expect(
      screen.queryByText(nudgeMatcher(copy.cart.nudge(7)))
    ).toBeNull();
  });
  it("free-shipping pending below 4 total units", () => {
    useCart.setState({ items: [line(3)] });
    render(<CartPage />);
    expect(
      screen.getByText(copy.cart.freeShippingPrompt(1))
    ).toBeInTheDocument();
  });
  it("free-shipping unlocked at 4+ total units", () => {
    useCart.setState({ items: [line(4)] });
    render(<CartPage />);
    expect(screen.getByText(copy.cart.freeUnlocked)).toBeInTheDocument();
  });
});
