import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LookupForm } from "@/app/(storefront)/lookup/lookup-form";
import { copy } from "@/lib/copy";

vi.mock("@/app/(storefront)/lookup/actions", () => ({
  lookupOrder: vi.fn(),
}));

// Turnstile is a no-op widget in tests (no NEXT_PUBLIC_TURNSTILE_SITE_KEY);
// surface a token immediately so the gated "Find my order" button is enabled.
// Mirrors the checkout-form test mock.
vi.mock("@/components/turnstile-widget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string) => void }) => {
    onToken("test-token");
    return null;
  },
}));

import { lookupOrder } from "@/app/(storefront)/lookup/actions";

const mockLookup = vi.mocked(lookupOrder);

describe("LookupForm", () => {
  beforeEach(() => {
    mockLookup.mockReset();
  });

  it("renders order # input, phone-last-4 input, and submit button", () => {
    render(<LookupForm initialOrderNumber="" />);
    expect(
      screen.getByRole("textbox", { name: /order number/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(copy.lookup.last4)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.common.findMyOrder })).toBeInTheDocument();
  });

  it("pre-fills the order number from the initial prop", () => {
    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    const orderInput = screen.getByRole("textbox", {
      name: /order number/i,
    }) as HTMLInputElement;
    expect(orderInput.value).toBe("NAG-20260521-A7K1");
  });

  it("shows a validation error when the order # format is wrong", async () => {
    render(<LookupForm initialOrderNumber="" />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /order number/i }),
      "not-an-order"
    );
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );
    await waitFor(() => {
      expect(
        screen.getByText(copy.errors.orderFormat)
      ).toBeInTheDocument();
    });
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("shows a validation error when phone last 4 is not 4 digits", async () => {
    render(<LookupForm initialOrderNumber="" />);
    await userEvent.type(
      screen.getByRole("textbox", { name: /order number/i }),
      "NAG-20260521-A7K1"
    );
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "12");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );
    await waitFor(() => {
      expect(
        screen.getByText(copy.errors.last4)
      ).toBeInTheDocument();
    });
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it("calls the action and renders the FOUND result with status + items + tracking button", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: true,
      summary: {
        orderNumber: "NAG-20260521-A7K1",
        status: "Shipped",
        itemsLine: "Bio Plant Booster ×1 @₱575",
        subtotal: "₱575",
        shipping: "₱120",
        trackingNumber: "JT9988776655",
      },
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    await waitFor(() => {
      expect(screen.getByText("Shipped")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Bio Plant Booster ×1 @₱575")
    ).toBeInTheDocument();
    const trackLink = screen.getByRole("link", { name: copy.lookup.trackJt });
    expect(trackLink).toHaveAttribute(
      "href",
      "https://www.jtexpress.ph/trajectoryQuery?waybillNo=JT9988776655&flag=1"
    );
    // IAB-safe — never opens a new tab.
    expect(trackLink).not.toHaveAttribute("target", "_blank");
  });

  it("renders 'we will text you' + Messenger CTA when trackingNumber is empty", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: true,
      summary: {
        orderNumber: "NAG-20260521-A7K1",
        status: "Confirmed",
        itemsLine: "Bio Plant Booster ×1 @₱575",
        subtotal: "₱575",
        shipping: "₱120",
        trackingNumber: "",
      },
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    await waitFor(() => {
      expect(screen.getByText("Confirmed")).toBeInTheDocument();
    });
    expect(
      screen.getByText(copy.lookup.confirmedNotice)
    ).toBeInTheDocument();
    const messengerLink = screen.getByRole("link", {
      name: copy.lookup.messageUs,
    });
    expect(messengerLink).toHaveAttribute("href", "https://m.me/noeltolentino2728");
    expect(
      screen.queryByRole("link", { name: copy.lookup.trackJt })
    ).not.toBeInTheDocument();
  });

  it("renders the not_found error message + Messenger CTA", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: false,
      error: "not_found",
      message:
        "Order not found. Double-check your order number and phone number, or message us.",
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/order not found/i);
    });
    const messengerLink = screen.getByRole("link", {
      name: copy.lookup.messageUsOnMessenger,
    });
    expect(messengerLink).toHaveAttribute("href", "https://m.me/noeltolentino2728");
  });

  it("renders the sheets-failure error message", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: false,
      error: "sheets",
      message: "We can't reach the order log right now — please message us.",
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /can't reach the order log/i
      );
    });
  });

  it("renders the rate_limited error message", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: false,
      error: "rate_limited",
      message: "Too many lookups. Please try again in a minute.",
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/too many lookups/i);
    });
  });

  it("passes the Turnstile token to the action and renders the turnstile error", async () => {
    mockLookup.mockResolvedValueOnce({
      ok: false,
      error: "turnstile",
      message: "Anti-spam check failed. Please retry.",
    });

    render(<LookupForm initialOrderNumber="NAG-20260521-A7K1" />);
    await userEvent.type(screen.getByLabelText(copy.lookup.last4), "4567");
    await userEvent.click(
      screen.getByRole("button", { name: copy.common.findMyOrder })
    );

    // The mocked widget supplies "test-token"; the action must receive it.
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith(
        expect.objectContaining({ turnstileToken: "test-token" })
      );
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/anti-spam check failed/i);
  });

  it("enforces maxLength on the phone-last-4 input", () => {
    render(<LookupForm initialOrderNumber="" />);
    const phoneInput = screen.getByLabelText(
      copy.lookup.last4
    ) as HTMLInputElement;
    expect(phoneInput).toHaveAttribute("maxLength", "4");
    expect(phoneInput).toHaveAttribute("inputMode", "numeric");
  });
});
