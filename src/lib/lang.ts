import { cookies, headers } from "next/headers";
import type { Lang } from "@/lib/copy";

/**
 * Server-side language resolution for the bilingual FIL/EN storefront.
 *
 * Filipino is the default and English is strictly opt-in. The only signals that
 * select English are an explicit `naf_lang=en` cookie or an `en-PH` browser
 * locale. Generic English (`en`, `en-US`, `en-GB`, …) is deliberately NOT an
 * opt-in: Googlebot and the Facebook crawler send `en-US` and MUST receive the
 * Filipino storefront so the `lang=fil` SEO surface serves the 250k Facebook
 * audience correctly.
 *
 * `getLangFromRequest()` runs in Server Components only (it awaits `cookies()`
 * / `headers()` from `next/headers`, which are async in Next.js 16). The client
 * `LangProvider` never reads the cookie itself — it receives the resolved value
 * as `initialLang` so there is no flash of the wrong language on hydration.
 */

/** Cookie that persists the buyer's explicit language choice. */
export const LANG_COOKIE = "naf_lang";

/** Cookie lifetime: 1 year, in seconds (for `max-age`). */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Default language when nothing else is recognized. */
const DEFAULT_LANG: Lang = "fil";

/** Filipino locale tags (case-insensitive) that select Filipino. */
const FIL_TAGS = new Set(["fil", "fil-ph", "tl", "tl-ph"]);

/** The only locale tag (case-insensitive) that opts into English. */
const EN_PH_TAG = "en-ph";

/** Narrow an arbitrary cookie value to a valid `Lang`, or null if invalid. */
function asLang(value: string | undefined): Lang | null {
  return value === "fil" || value === "en" ? value : null;
}

/**
 * Resolve a language from an `Accept-Language` header value.
 *
 * Pure and exported so it can be unit-tested without mocking `next/headers`.
 * Tags are ranked strictly by q-value (a tag with no `q` defaults to q=1);
 * the highest-q tag that we recognize wins. Unrecognized tags — including
 * generic English — are skipped, not treated as a match.
 */
export function resolveLangFromAcceptLanguage(header: string | null): Lang {
  if (!header) return DEFAULT_LANG;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tagRaw, ...params] = part.trim().split(";");
      const tag = tagRaw.trim().toLowerCase();
      if (!tag) return null;
      let q = 1;
      for (const param of params) {
        const [key, val] = param.trim().split("=");
        if (key.trim().toLowerCase() === "q") {
          const parsed = Number.parseFloat(val);
          if (Number.isFinite(parsed)) q = parsed;
        }
      }
      return { tag, q };
    })
    .filter((entry): entry is { tag: string; q: number } => entry !== null)
    // Highest q-value first. Stable for equal q (preserves header order).
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (tag === EN_PH_TAG) return "en";
    if (FIL_TAGS.has(tag)) return "fil";
    // Anything else (generic English, other locales) is skipped.
  }

  return DEFAULT_LANG;
}

/**
 * Resolve the request's language in a Server Component.
 *
 * Precedence: a valid `naf_lang` cookie wins; otherwise fall back to parsing
 * the `Accept-Language` header; otherwise default to Filipino.
 */
export async function getLangFromRequest(): Promise<Lang> {
  const cookieStore = await cookies();
  const fromCookie = asLang(cookieStore.get(LANG_COOKIE)?.value);
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  return resolveLangFromAcceptLanguage(headerStore.get("accept-language"));
}
