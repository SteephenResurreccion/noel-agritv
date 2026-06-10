"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getCopy, type Copy, type Lang } from "@/lib/copy";

/**
 * Client-side language state for the bilingual FIL/EN storefront.
 *
 * The provider is seeded by `initialLang`, which the server layout resolves via
 * `getLangFromRequest()` (see `@/lib/lang`). The client never reads the cookie
 * for its initial state — that avoids a flash of the wrong language on
 * hydration. `setLang` persists the choice to the `naf_lang` cookie and calls
 * `router.refresh()` so Server Components re-render in the new language.
 *
 * Cookie name / lifetime are kept in sync with `LANG_COOKIE` /
 * `LANG_COOKIE_MAX_AGE` in `@/lib/lang`. They are inlined here (rather than
 * imported) because `lang.ts` imports `next/headers`, which must not enter the
 * client bundle.
 */

const LANG_COOKIE = "naf_lang";
const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, seconds

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}): React.ReactElement {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      // `Secure` keeps the cookie HTTPS-only in production. Chromium treats
      // http://localhost as trustworthy, so local dev still sets it fine.
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax; Secure`;
      setLangState(next);
      // Re-render Server Components so server-rendered copy switches language.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** Read `{ lang, setLang }`. Throws if used outside `LangProvider`. */
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (ctx === null) {
    throw new Error("useLang must be used within a LangProvider");
  }
  return ctx;
}

/** Read the copy bundle for the current language. Throws outside `LangProvider`. */
export function useCopy(): Copy {
  const { lang } = useLang();
  return useMemo(() => getCopy(lang), [lang]);
}
