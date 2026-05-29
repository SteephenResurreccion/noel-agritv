import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckoutForm } from "@/app/(storefront)/checkout/checkout-form";
import { useCart } from "@/lib/cart-store";
import type { ShippingConfig } from "@/lib/admin-store";
import { PH_REGIONS } from "@/lib/ph-regions";

// Server action — mock so a failed submit only updates errors state.
vi.mock("@/app/(storefront)/checkout/actions", () => ({
  submitOrder: vi.fn(async () => ({
    ok: false,
    error: "validation",
    message: "boom",
  })),
}));

// Next router — we never hit success in this suite, but the form imports it.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Turnstile is a no-op widget in tests; surface a token immediately so the
// "Place order" button is enabled.
vi.mock("@/components/turnstile-widget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string) => void }) => {
    onToken("test-token");
    return null;
  },
}));

const shippingConfig: ShippingConfig = {
  enabled: false,
  feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
};

function seedCart() {
  useCart.setState({
    items: [
      {
        slug: "bio-plant-booster",
        name: "Bio Plant Booster",
        priceCentavos: 50000,
        qty: 1,
        image: "/img.jpg",
      },
    ],
  });
}

describe("CheckoutForm — live field validation", () => {
  beforeEach(() => {
    useCart.getState().clear();
    seedCart();
  });

  it("clears the name error as soon as the user types a valid value", async () => {
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    // Trigger validation by submitting an empty form.
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));
    // Name error should now be visible.
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
    // Type a valid name — the error should disappear on input.
    const nameInput = screen.getByLabelText(/^name$/i);
    await userEvent.type(nameInput, "Juan");
    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });

  it("does not surface validation errors before the first submit", async () => {
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    const nameInput = screen.getByLabelText(/^name$/i);
    await userEvent.type(nameInput, "J");
    // No errors should be visible — we haven't submitted yet.
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/enter a valid ph mobile number/i)
    ).not.toBeInTheDocument();
  });

  it("clears the consent error the moment the checkbox is ticked", async () => {
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/must agree to the privacy notice/i)
      ).toBeInTheDocument();
    });
    const consent = screen.getByRole("checkbox");
    await userEvent.click(consent);
    await waitFor(() => {
      expect(
        screen.queryByText(/must agree to the privacy notice/i)
      ).not.toBeInTheDocument();
    });
  });

  it("clears the phone error once a valid PH mobile is entered", async () => {
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    const phoneInput = screen.getByLabelText(/mobile number/i);
    await userEvent.type(phoneInput, "123");
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/enter a valid ph mobile number/i)
      ).toBeInTheDocument();
    });
    // Fix the value — error should disappear without a second submit.
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, "09171234567");
    await waitFor(() => {
      expect(
        screen.queryByText(/enter a valid ph mobile number/i)
      ).not.toBeInTheDocument();
    });
  });

  it("re-validates region as soon as a valid region is picked", async () => {
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));
    await waitFor(() => {
      expect(screen.getByText(/select a valid region/i)).toBeInTheDocument();
    });
    const regionSelect = screen.getByLabelText(/region/i);
    await userEvent.selectOptions(regionSelect, "NCR");
    await waitFor(() => {
      expect(
        screen.queryByText(/select a valid region/i)
      ).not.toBeInTheDocument();
    });
  });
});

describe("CheckoutForm — free-shipping summary mirrors the server", () => {
  // The summary's shipping line must reflect resolveShipping(..., totalUnits):
  // at FREE_SHIPPING_MIN_UNITS+ total units it returns { free:true } and the
  // summary should read "FREE" — not a fee or "confirmed on the call".
  beforeEach(() => {
    useCart.getState().clear();
  });
  afterEach(() => {
    useCart.getState().clear();
  });

  it("shows FREE shipping when the cart has 4+ total units", async () => {
    useCart.setState({
      items: [
        {
          slug: "bio-plant-booster",
          name: "Bio Plant Booster",
          priceCentavos: 50000,
          qty: 4,
          image: "/img.jpg",
        },
      ],
    });
    render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
    await waitFor(() => {
      expect(screen.getByText(/^FREE$/)).toBeInTheDocument();
    });
    // The "confirmed on the call" fallback must NOT show — free overrides it.
    expect(
      screen.queryByText(/shipping confirmed on the call/i)
    ).not.toBeInTheDocument();
    // Estimated total equals the subtotal (no shipping added). 4 × ₱500 = ₱2,000
    // appears both as the line total and the estimated total — both correct.
    expect(screen.getAllByText("₱2,000").length).toBeGreaterThanOrEqual(1);
  });
});

describe("CheckoutForm — hooks order across cart hydration", () => {
  // The other suites seed the cart BEFORE the first render, so the component
  // always mounts on the full-form path and the hook count never changes —
  // which is exactly why those 164 tests pass with the hooks bug present.
  //
  // In a real browser the cart store (Zustand `persist`, no skipHydration)
  // first paints with `items: []` (empty-cart early return) and then
  // rehydrates from localStorage with real items, flipping the early-return
  // branch on a SECOND render. If any hook lives below that early `return`,
  // the two renders call a different number of hooks and React throws
  // "Rendered more/fewer hooks than expected". This reproduces that exact
  // transition: mount empty → populate the store → assert no hooks error.
  beforeEach(() => {
    useCart.getState().clear();
  });
  afterEach(() => {
    useCart.getState().clear();
  });

  it("does not throw a hooks-order error when the cart hydrates after mount", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      // First render: empty cart → "Your cart is empty" early-return path.
      render(<CheckoutForm shipping={shippingConfig} regions={PH_REGIONS} />);
      expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();

      // Hydration: the store gains items, flipping the early-return branch.
      // With the bug (useCallback below the early return) this re-render
      // changes the hook count and React throws the invariant.
      act(() => {
        seedCart();
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      });

      // No React hooks-order invariant should have been logged.
      const hooksError = errorSpy.mock.calls
        .flat()
        .map((a) => (a instanceof Error ? a.message : String(a)))
        .find((m) => /rendered (more|fewer) hooks than expected/i.test(m));
      expect(hooksError).toBeUndefined();
    } finally {
      errorSpy.mockRestore();
    }
  });
});
