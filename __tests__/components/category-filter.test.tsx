import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryFilter } from "@/components/category-filter";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

describe("CategoryFilter", () => {
  it("renders All pill plus one pill per category", () => {
    render(<CategoryFilter />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Crop Care")).toBeInTheDocument();
    expect(screen.getByText("Seeds")).toBeInTheDocument();
  });
});
