"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/copy";

/**
 * Compact FIL / EN segmented control — the persistent way to switch language
 * after the first-visit chooser (`language-modal.tsx`) has been dismissed.
 *
 * Built on Base UI's single-select ToggleGroup (`@/components/ui/toggle-group`),
 * the repo's official UI primitive. The group is a padded pill whose active item
 * (gold brand accent, matching the modal's primary button) is inset inside the
 * container's rounded corners, so the fill can never bleed past the border. Each
 * item renders a real `<button aria-pressed=…>`; the active language reflects
 * `useLang().lang`.
 *
 * Selecting the inactive item calls `setLang(...)` from `useLang()`, which writes
 * the `naf_lang` cookie and triggers `router.refresh()` so Server Components
 * re-render in the new language. Re-selecting the active item is a no-op: Base UI
 * would deselect it to an empty array, but we ignore that case so the group is
 * never empty (always exactly one language pressed).
 *
 * The "FIL" / "EN" labels are language-NEUTRAL abbreviations — identical in both
 * languages — so they're hardcoded here rather than threaded through copy.ts.
 * `aria-label`s ("Filipino" / "English") and the group label ("Language / Wika")
 * are likewise neutral.
 *
 * Layout: the parent controls placement (desktop header cluster vs. mobile
 * drawer). Each item is `min-h-12` (48px) tall on mobile so the button's own
 * hit area satisfies the touch-target budget in the drawer, and ~36px on
 * desktop (`lg:min-h-[32px]`). The breakpoint is `lg:` to match the header's
 * mobile↔desktop split.
 */

const SEGMENTS: { value: Lang; label: string; aria: string }[] = [
  { value: "fil", label: "FIL", aria: "Filipino" },
  { value: "en", label: "EN", aria: "English" },
];

export function LangSwitcher(): React.ReactElement {
  const { lang, setLang } = useLang();

  return (
    <ToggleGroup
      aria-label="Language / Wika"
      value={[lang]}
      onValueChange={(value) => {
        // Single-select: `value` is [] when the active item is re-tapped
        // (Base UI deselects). Ignore that — never allow an empty group.
        const next = value[0];
        if (next && next !== lang) setLang(next as Lang);
      }}
    >
      {SEGMENTS.map((seg) => (
        <ToggleGroupItem
          key={seg.value}
          value={seg.value}
          aria-label={seg.aria}
          className="min-h-12 min-w-12 lg:min-h-[26px] lg:min-w-0"
        >
          {seg.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
