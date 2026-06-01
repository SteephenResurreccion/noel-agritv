import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithLang as render, screen, act, fireEvent } from "../test-utils";

// LangProvider (mounted by renderWithLang) calls useRouter() on every render,
// and the real setLang invokes router.refresh(). Stub it so the modal exercises
// the REAL setLang path (cookie write + state update) without a Next router.
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function clearCookies() {
  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  });
}

beforeEach(() => {
  refresh.mockClear();
  clearCookies();
});

afterEach(() => {
  vi.clearAllMocks();
  clearCookies();
});

// The mount guard (useHasMounted) resolves to `true` synchronously inside React
// Testing Library's act() wrapper, so after render the modal is already shown
// when no cookie exists. To assert the pre-mount / SSR-empty render we render to
// a static string via the server snapshot path (see dedicated test below).

describe("LanguageModal — visibility", () => {
  it("renders nothing when a naf_lang cookie already exists", async () => {
    document.cookie = "naf_lang=fil; path=/";
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders nothing on the server / before mount (SSR safety)", async () => {
    // renderToString never reaches the mounted state — useHasMounted returns the
    // server snapshot (false), so the modal must produce no markup.
    const { renderToString } = await import("react-dom/server");
    const { LangProvider } = await import("@/lib/lang-context");
    const { LanguageModal } = await import("@/components/language-modal");
    const html = renderToString(
      <LangProvider initialLang="fil">
        <LanguageModal />
      </LangProvider>,
    );
    expect(html).toBe("");
  });

  it("shows the modal after mount when no cookie is set", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("LanguageModal — accessibility", () => {
  it("has role=dialog and aria-modal=true", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label");
  });

  it("shows BOTH languages simultaneously (pre-choice UI)", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    // Bilingual title — both strings present at once.
    expect(screen.getByText(/Piliin ang wika/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose your language/i)).toBeInTheDocument();
  });

  it("gives both choice buttons a 48px+ touch target (min-h-12)", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const fil = screen.getByRole("button", { name: /filipino/i });
    const en = screen.getByRole("button", { name: /^english$/i });
    expect(fil.className).toContain("min-h-12");
    expect(en.className).toContain("min-h-12");
  });

  it("moves focus into the modal on open", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

describe("LanguageModal — choosing a language", () => {
  it("clicking Filipino writes naf_lang=fil and closes the modal", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    act(() => {
      screen.getByRole("button", { name: /filipino/i }).click();
    });
    expect(document.cookie).toContain("naf_lang=fil");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });

  it("clicking English writes naf_lang=en and closes the modal", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    act(() => {
      screen.getByRole("button", { name: /^english$/i }).click();
    });
    expect(document.cookie).toContain("naf_lang=en");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("LanguageModal — dismissal defaults to Filipino", () => {
  it("Esc key dismisses: writes naf_lang=fil and closes", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(document.cookie).toContain("naf_lang=fil");
    expect(container).toBeEmptyDOMElement();
  });

  it("backdrop click dismisses: writes naf_lang=fil and closes", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    const backdrop = screen.getByTestId("language-modal-backdrop");
    act(() => {
      fireEvent.click(backdrop);
    });
    expect(document.cookie).toContain("naf_lang=fil");
    expect(container).toBeEmptyDOMElement();
  });

  it("clicking the close button dismisses: writes naf_lang=fil and closes", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    act(() => {
      screen.getByRole("button", { name: /close|isara/i }).click();
    });
    expect(document.cookie).toContain("naf_lang=fil");
    expect(container).toBeEmptyDOMElement();
  });

  it("does not reappear after a dismissal within the same render", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(container).toBeEmptyDOMElement();
    // A second Esc must not resurrect it.
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("LanguageModal — layering & scroll lock", () => {
  it("backdrop sits above the sticky bottom bar (z-[60] > z-50)", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const backdrop = screen.getByTestId("language-modal-backdrop");
    expect(backdrop.className).toContain("z-[60]");
  });

  it("locks body scroll while open and restores it after dismissal", async () => {
    // Seed a prior inline value so we can assert it's restored, not blanked.
    document.body.style.overflow = "auto";
    const { LanguageModal } = await import("@/components/language-modal");
    const { container } = render(<LanguageModal />);

    // Open → scroll locked.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    // Dismiss → previous value restored.
    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(container).toBeEmptyDOMElement();
    expect(document.body.style.overflow).toBe("auto");
  });
});

describe("LanguageModal — focus trap", () => {
  it("Tab from the last focusable wraps to the first", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const dialog = screen.getByRole("dialog");
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    last.focus();
    act(() => {
      fireEvent.keyDown(dialog, { key: "Tab" });
    });
    expect(document.activeElement).toBe(first);
  });

  it("Shift+Tab from the first focusable wraps to the last", async () => {
    const { LanguageModal } = await import("@/components/language-modal");
    render(<LanguageModal />);
    const dialog = screen.getByRole("dialog");
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    first.focus();
    act(() => {
      fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    });
    expect(document.activeElement).toBe(last);
  });
});
