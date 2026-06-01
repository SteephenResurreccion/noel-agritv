import { describe, it, expect, vi } from "vitest";
import { renderWithLang as render, screen } from "../test-utils";
import { CategoryFilter } from "@/components/category-filter";
import { copy } from "@/lib/copy";
import { categories } from "@/data/categories";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

// `refresh` is included because the render wrapper (renderWithLang) mounts
// LangProvider, which calls useRouter().refresh on language change.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: () => {} }),
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
