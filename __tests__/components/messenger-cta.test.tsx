import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessengerCTA } from "@/components/messenger-cta";
import { copy } from "@/lib/copy";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

describe("MessengerCTA", () => {
  it("renders with default text", () => {
    render(<MessengerCTA />);
    expect(screen.getByRole("link")).toHaveTextContent(copy.common.messenger);
  });

  it("renders product-specific label when productName is provided", () => {
    render(<MessengerCTA productName="Bio Enzyme" />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(copy.common.messengerAboutProduct);
  });

  it("links to Messenger page", () => {
    render(<MessengerCTA />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://m.me/noeltolentino2728"
    );
  });

  it("renders custom label when provided", () => {
    render(<MessengerCTA label="Ask on Messenger" />);
    expect(screen.getByRole("link")).toHaveTextContent("Ask on Messenger");
  });
});
