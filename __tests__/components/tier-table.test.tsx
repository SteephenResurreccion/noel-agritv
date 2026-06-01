import { describe, it, expect, vi } from "vitest";
import { renderWithLang as render, screen } from "../test-utils";
import { TierTable } from "@/components/tier-table";

// The render wrapper (renderWithLang) mounts LangProvider, which calls
// useRouter() on every render — stub it so the App Router context isn't required.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {} }),
}));

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

  // Spec §3: tier boundaries — last-wins `qty >= minQty` selection.
  it.each([
    [11, 1],
    [12, 12],
    [23, 12],
    [24, 24],
    [35, 24],
    [36, 36],
  ])("activeQty=%i marks tier-row-%i active", (activeQty, expectedMinQty) => {
    render(<TierTable tiers={tiers} activeQty={activeQty} />);
    expect(screen.getByTestId(`tier-row-${expectedMinQty}`)).toHaveAttribute("data-active", "true");
  });

  it("sets aria-current on the active row only", () => {
    render(<TierTable tiers={tiers} activeQty={12} />);
    expect(screen.getByTestId("tier-row-12")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("tier-row-1")).not.toHaveAttribute("aria-current");
  });
});
