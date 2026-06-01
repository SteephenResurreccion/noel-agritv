"use client";

import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/copy";

/**
 * Compact FIL / EN segmented control — the persistent way to switch language
 * after the first-visit chooser (`language-modal.tsx`) has been dismissed.
 *
 * Two real `<button>` segments in a `role="group"`. The active language is
 * filled (gold brand accent, matching the modal's primary button) and carries
 * `aria-pressed="true"`; tapping it is a no-op. Tapping the inactive segment
 * calls `setLang(...)` from `useLang()`, which writes the `naf_lang` cookie and
 * triggers `router.refresh()` so Server Components re-render in the new language.
 *
 * The "FIL" / "EN" labels are language-NEUTRAL abbreviations — identical in both
 * languages — so they're hardcoded here rather than threaded through copy.ts.
 * `aria-label`s ("Filipino" / "English") are likewise neutral.
 *
 * Layout: the parent controls placement (desktop header cluster vs. mobile
 * drawer). The control itself is full-content-width and keeps a quiet, utility
 * appearance. Each segment is ≥48px tall (`min-h-12`) so it satisfies the
 * touch-target budget when rendered in the mobile drawer.
 */

const SEGMENTS: { value: Lang; label: string; aria: string }[] = [
  { value: "fil", label: "FIL", aria: "Filipino" },
  { value: "en", label: "EN", aria: "English" },
];

export function LangSwitcher(): React.ReactElement {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language / Wika"
      className="inline-flex items-center overflow-hidden rounded-md border border-border"
    >
      {SEGMENTS.map((seg) => {
        const active = lang === seg.value;
        return (
          <button
            key={seg.value}
            type="button"
            aria-label={seg.aria}
            aria-pressed={active}
            onClick={() => {
              if (!active) setLang(seg.value);
            }}
            className={
              "flex min-h-12 min-w-12 items-center justify-center px-2.5 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent md:min-h-9 " +
              (active
                ? "bg-brand-accent text-white"
                : "text-text-secondary hover:text-text-primary")
            }
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
