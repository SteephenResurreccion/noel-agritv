import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TierTable } from "@/components/tier-table";

const tiers = [
  { minQty: 1, priceCentavos: 54800 },
  { minQty: 12, priceCentavos: 52000 },
  { minQty: 24, priceCentavos: 44500 },
  { minQty: 36, priceCentavos: 39800 },
];

describe("TierTable", () => {
  it("renders all four tiers as peso-per-item with range labels", () => {
    render(<TierTable tiers={tiers} activeQty={1} />);
    for (const p of ["₱548", "₱520", "₱445", "₱398"]) expect(screen.getByText(p)).toBeInTheDocument();
    expect(screen.getByText("1–11")).toBeInTheDocument();   // en-dash
    expect(screen.getByText("12–23")).toBeInTheDocument();
    expect(screen.getByText("36+")).toBeInTheDocument();
  });
  it("marks the tier row whose range contains activeQty", () => {
    render(<TierTable tiers={tiers} activeQty={12} />);
    expect(screen.getByTestId("tier-row-12")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("tier-row-1")).toHaveAttribute("data-active", "false");
  });
  it("activeQty=1 highlights the first tier", () => {
    render(<TierTable tiers={tiers} activeQty={1} />);
    expect(screen.getByTestId("tier-row-1")).toHaveAttribute("data-active", "true");
  });
});
