"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/lang-context";
import { useHasMounted } from "@/lib/use-has-mounted";

/**
 * First-visit language chooser.
 *
 * Pops in (client-only) on the first storefront visit — when no `naf_lang`
 * cookie exists yet — and lets the buyer pick Filipino or English. The Filipino
 * page renders behind it; this overlay only appears after client mount so
 * crawlers and the SSR pass never see it (no hydration mismatch).
 *
 * WHY the strings here are HARDCODED BILINGUAL (not from copy.ts):
 * copy.ts resolves to ONE language, but at this exact moment the buyer hasn't
 * chosen one yet — so the chooser must show BOTH languages at once. Pulling
 * these from copy.ts would show only the (server-guessed) default and defeat
 * the purpose of the picker. These few strings are intentionally inlined.
 *
 * Behaviour:
 * - Choosing a language → `setLang(...)` (writes the cookie + refreshes Server
 *   Components) → modal closes for good.
 * - Any dismissal (Esc, backdrop, close button) DEFAULTS TO FILIPINO — it also
 *   calls `setLang("fil")` so the cookie is written and the modal never returns.
 * - IAB-safe: it's an inline fixed overlay, no window.open / popup / new tab.
 */

// Cookie name kept in sync with LANG_COOKIE in @/lib/lang (+ lang-context.tsx).
// Inlined here to avoid importing lang.ts (which pulls in next/headers and must
// not enter the client bundle).
const LANG_COOKIE = "naf_lang";

function hasLangCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${LANG_COOKIE}=`));
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function LanguageModal(): React.ReactElement | null {
  const { setLang } = useLang();
  const mounted = useHasMounted();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  // Element focused before the modal opened, to restore on close.
  const previouslyFocused = useRef<Element | null>(null);

  // `dismissed` is the ONLY piece of state and it's set from user events
  // (click / Esc), never from an effect — so no setState-in-effect lint hit.
  // Visibility is otherwise DERIVED at render time:
  //   open = mounted && no cookie && not dismissed.
  // The cookie is read during render, but it's gated by `mounted`: on the
  // server and the first client render `mounted` is false, so we bail to null
  // (matching the server snapshot — no hydration mismatch). The cookie is only
  // consulted once we're safely on the client.
  const [dismissed, setDismissed] = useState(false);
  const open = mounted && !dismissed && !hasLangCookie();

  const close = useCallback(() => {
    setDismissed(true);
    // Restore focus to whatever was focused before the modal stole it.
    if (previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
  }, []);

  const choose = useCallback(
    (lang: "fil" | "en") => {
      setLang(lang); // writes cookie + router.refresh()
      close();
    },
    [setLang, close],
  );

  // Dismissal (Esc / backdrop / close button) defaults to Filipino so the modal
  // never reappears: setLang("fil") still writes the cookie.
  const dismiss = useCallback(() => choose("fil"), [choose]);

  // Move focus into the modal on open; remember where it came from.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const node = dialogRef.current;
    if (!node) return;
    const first = node.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [open]);

  // Esc + focus-trap, scoped to while the modal is open.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const node = dialogRef.current;
      if (!node) return;
      const focusables = Array.from(
        node.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      data-testid="language-modal-backdrop"
      onClick={dismiss}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Piliin ang wika / Choose your language"
        // Stop backdrop dismissal when clicking inside the card.
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl"
      >
        <div className="mb-5 text-center">
          <h2 className="text-lg font-bold text-text-primary">
            Piliin ang wika
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Choose your language
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => choose("fil")}
            className="min-h-12 w-full rounded-xl bg-brand-accent px-6 text-base font-bold text-white transition-colors hover:bg-brand-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            Filipino
          </button>
          <button
            type="button"
            onClick={() => choose("en")}
            className="min-h-12 w-full rounded-xl border border-border bg-surface px-6 text-base font-bold text-text-primary transition-colors hover:bg-wheat focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            English
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-text-secondary">
          Pwede mo itong palitan anumang oras.{" "}
          <span className="block sm:inline">You can change this anytime.</span>
        </p>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Isara / Close"
          className="mt-4 w-full text-center text-xs font-medium text-text-secondary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
        >
          Isara / Close
        </button>
      </div>
    </div>
  );
}
