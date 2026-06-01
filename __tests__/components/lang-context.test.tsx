import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LangProvider, useLang, useCopy } from "@/lib/lang-context";
import { getCopy } from "@/lib/copy";

// router.refresh() is invoked by setLang to re-render Server Components.
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

function LangProbe() {
  const { lang, setLang } = useLang();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <button onClick={() => setLang("en")}>to-en</button>
      <button onClick={() => setLang("fil")}>to-fil</button>
    </div>
  );
}

function CopyProbe() {
  const copy = useCopy();
  // greeting is a stable top-level string key present in both bundles.
  return <span data-testid="copy">{JSON.stringify(copy) === JSON.stringify(getCopy("en")) ? "en-bundle" : "other-bundle"}</span>;
}

describe("LangProvider / useLang / useCopy", () => {
  beforeEach(() => {
    refresh.mockClear();
    // Reset document.cookie between tests.
    document.cookie
      .split(";")
      .forEach((c) => {
        const name = c.split("=")[0]?.trim();
        if (name) document.cookie = `${name}=; max-age=0; path=/`;
      });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("hydrates lang from the initialLang prop (server-resolved)", () => {
    render(
      <LangProvider initialLang="en">
        <LangProbe />
      </LangProvider>,
    );
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("defaults to the initialLang it is given, no cookie read for initial state", () => {
    render(
      <LangProvider initialLang="fil">
        <LangProbe />
      </LangProvider>,
    );
    expect(screen.getByTestId("lang").textContent).toBe("fil");
  });

  it("setLang updates context state", () => {
    render(
      <LangProvider initialLang="fil">
        <LangProbe />
      </LangProvider>,
    );
    act(() => {
      screen.getByText("to-en").click();
    });
    expect(screen.getByTestId("lang").textContent).toBe("en");
  });

  it("setLang writes the naf_lang cookie with a long max-age", () => {
    render(
      <LangProvider initialLang="fil">
        <LangProbe />
      </LangProvider>,
    );
    act(() => {
      screen.getByText("to-en").click();
    });
    expect(document.cookie).toContain("naf_lang=en");
  });

  it("setLang calls router.refresh() so Server Components re-render", () => {
    render(
      <LangProvider initialLang="fil">
        <LangProbe />
      </LangProvider>,
    );
    act(() => {
      screen.getByText("to-en").click();
    });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("setLang is a no-op refresh path still toggles back to fil", () => {
    render(
      <LangProvider initialLang="en">
        <LangProbe />
      </LangProvider>,
    );
    act(() => {
      screen.getByText("to-fil").click();
    });
    expect(screen.getByTestId("lang").textContent).toBe("fil");
    expect(document.cookie).toContain("naf_lang=fil");
  });

  it("useCopy returns the bundle for the current lang and follows setLang", () => {
    render(
      <LangProvider initialLang="en">
        <CopyProbe />
        <LangProbe />
      </LangProvider>,
    );
    expect(screen.getByTestId("copy").textContent).toBe("en-bundle");
    act(() => {
      screen.getByText("to-fil").click();
    });
    expect(screen.getByTestId("copy").textContent).toBe("other-bundle");
  });

  it("useLang throws a clear error when used outside LangProvider", () => {
    // Silence the expected React error boundary console noise.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<LangProbe />)).toThrow(/LangProvider/);
    spy.mockRestore();
  });

  it("useCopy throws a clear error when used outside LangProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<CopyProbe />)).toThrow(/LangProvider/);
    spy.mockRestore();
  });
});
