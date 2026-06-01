import type { ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { LangProvider } from "@/lib/lang-context";
import type { Lang } from "@/lib/copy";

/**
 * Render a component tree wrapped in `LangProvider` so components that call
 * `useCopy()` / `useLang()` resolve against a concrete language.
 *
 * Filipino is the storefront default, so `lang` defaults to `"fil"` — matching
 * what an unconfigured request resolves to. Pass `{ lang: "en" }` to exercise the
 * English bundle. Later sub-tasks (when client components switch to `useCopy()`)
 * swap their bare `render(...)` calls for `renderWithLang(...)`; keeping the
 * wrapper here makes that a one-line change per test.
 */
export function renderWithLang(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { lang?: Lang },
): RenderResult {
  const { lang = "fil", ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <LangProvider initialLang={lang}>{children}</LangProvider>
    ),
    ...renderOptions,
  });
}

// Re-export the testing-library surface so test files can import everything from
// one place (`screen`, `within`, `fireEvent`, `waitFor`, …) alongside the helper.
export * from "@testing-library/react";
