import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithLang as render, screen, fireEvent } from "../test-utils";

// LangProvider (mounted by renderWithLang) calls useRouter() on every render,
// so next/navigation must be mocked. setLang() also calls router.refresh().
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { LangSwitcher } from "@/components/lang-switcher";

beforeEach(() => {
  refresh.mockClear();
  // Reset the cookie that setLang writes, so each test starts clean.
  document.cookie = "naf_lang=; path=/; max-age=0";
});

describe("LangSwitcher", () => {
  it("renders both FIL and EN segments as buttons inside a labelled group", () => {
    render(<LangSwitcher />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/language/i),
    );
    expect(screen.getByRole("button", { name: "Filipino" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByText("FIL")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  it("marks the current language (fil default) active via aria-pressed", () => {
    render(<LangSwitcher />); // defaults to fil
    expect(screen.getByRole("button", { name: "Filipino" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("marks EN active when initialLang is en", () => {
    render(<LangSwitcher />, { lang: "en" });
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Filipino" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switching to the inactive language updates the active segment and refreshes", () => {
    render(<LangSwitcher />); // fil active
    fireEvent.click(screen.getByRole("button", { name: "English" }));

    // setLang -> context update -> EN becomes active, FIL inactive.
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Filipino" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    // setLang writes the cookie...
    expect(document.cookie).toContain("naf_lang=en");
    // ...and triggers a router.refresh() so Server Components re-render.
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("tapping the already-active segment is a no-op (no cookie write, no refresh)", () => {
    render(<LangSwitcher />); // fil active
    fireEvent.click(screen.getByRole("button", { name: "Filipino" }));

    expect(screen.getByRole("button", { name: "Filipino" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(document.cookie).not.toContain("naf_lang=fil");
  });

  it("each segment meets the mobile touch-target budget (48px item via min-h-12)", () => {
    render(<LangSwitcher />);
    for (const name of ["Filipino", "English"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-12");
    }
  });
});
