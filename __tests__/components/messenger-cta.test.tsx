import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessengerCTA } from "@/components/messenger-cta";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

describe("MessengerCTA", () => {
  it("renders with default text", () => {
    render(<MessengerCTA />);
    expect(screen.getByRole("link")).toHaveTextContent("Message Us");
  });

  it("renders product-specific label when productName is provided", () => {
    render(<MessengerCTA productName="Bio Enzyme" />);
    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Message Us About This Product");
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
