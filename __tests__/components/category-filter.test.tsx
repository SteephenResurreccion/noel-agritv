import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryFilter } from "@/components/category-filter";
import { copy } from "@/lib/copy";
import { categories } from "@/data/categories";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
}));

describe("CategoryFilter", () => {
  it("renders All pill plus one pill per category", () => {
    render(<CategoryFilter />);
    expect(screen.getByText(copy.common.filterAll)).toBeInTheDocument();
    // Category names are Taglish seed data; reference the data import so the
    // assertion tracks the real values instead of hardcoded English.
    for (const category of categories) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });
});
