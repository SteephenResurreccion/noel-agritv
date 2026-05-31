import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useCart } from "@/lib/cart-store";
import { copy } from "@/lib/copy";

// Default mock — overridden inside individual describes via vi.doMock.
vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
}));

const sampleItem = {
  slug: "bio-plant-booster",
  name: "Bio Plant Booster",
  priceCentavos: 25000,
  image: "/x.png",
};

beforeEach(() => {
  useCart.getState().clear();
});

afterEach(() => {
  // Clean up any data-cart-active attribute we may have set on body.
  document.body.removeAttribute("data-cart-active");
});

describe("CheckoutBar — visibility based on cart state", () => {
  it("renders nothing when the cart is empty", async () => {
    const { CheckoutBar } = await import("@/components/checkout-bar");
    const { container } = render(<CheckoutBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the bar with subtotal and Checkout link when cart has items", async () => {
    useCart.getState().addItem(sampleItem, 2);
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByText(copy.checkoutBar.count(2))).toBeInTheDocument();
    expect(screen.getByText("₱500")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /checkout/i });
    expect(link).toHaveAttribute("href", "/checkout");
  });

  it("uses singular 'item' for exactly one item in the cart", async () => {
    useCart.getState().addItem(sampleItem, 1);
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByText(copy.checkoutBar.count(1))).toBeInTheDocument();
    expect(screen.queryByText(/1 items/i)).not.toBeInTheDocument();
  });

  it("uses plural 'items' when there are 2 or more", async () => {
    useCart.getState().addItem(sampleItem, 3);
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByText(copy.checkoutBar.count(3))).toBeInTheDocument();
  });
});

describe("CheckoutBar — hidden routes", () => {
  beforeEach(() => {
    useCart.getState().clear();
    useCart.getState().addItem(sampleItem, 2);
    vi.resetModules();
  });

  it("is hidden on /cart", async () => {
    vi.doMock("next/navigation", () => ({ usePathname: () => "/cart" }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    const { container } = render(<CheckoutBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden on /checkout", async () => {
    vi.doMock("next/navigation", () => ({ usePathname: () => "/checkout" }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    const { container } = render(<CheckoutBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden on /checkout/confirmation", async () => {
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/checkout/confirmation",
    }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    const { container } = render(<CheckoutBar />);
    expect(container).toBeEmptyDOMElement();
  });

  it("is hidden on /admin/* routes", async () => {
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/admin/orders",
    }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    const { container } = render(<CheckoutBar />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("CheckoutBar — visible routes", () => {
  beforeEach(() => {
    useCart.getState().clear();
    useCart.getState().addItem(sampleItem, 1);
    vi.resetModules();
  });

  it("is visible on /products", async () => {
    vi.doMock("next/navigation", () => ({ usePathname: () => "/products" }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByRole("link", { name: /checkout/i })).toBeInTheDocument();
  });

  it("is visible on /products/[slug]", async () => {
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/products/bio-plant-booster",
    }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByRole("link", { name: /checkout/i })).toBeInTheDocument();
  });

  it("is visible on /", async () => {
    vi.doMock("next/navigation", () => ({ usePathname: () => "/" }));
    const { CheckoutBar } = await import("@/components/checkout-bar");
    render(<CheckoutBar />);
    expect(screen.getByRole("link", { name: /checkout/i })).toBeInTheDocument();
  });
});
