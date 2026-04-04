import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MessengerCTA } from "@/components/messenger-cta";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

describe("MessengerCTA", () => {
  it("renders with default text", () => {
    render(<MessengerCTA />);
    expect(screen.getByRole("link")).toHaveTextContent("Message Us");
  });

  it("generates prefilled Messenger link for product inquiry", () => {
    render(
      <MessengerCTA productName="Bio Enzyme" packSize="250ml" />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("m.me/noeltolentino2728?text=")
    );
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("Bio%20Enzyme")
    );
  });

  it("uses plain Messenger URL when no product specified", () => {
    render(<MessengerCTA />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      "https://m.me/noeltolentino2728"
    );
  });
});
