"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
    };
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export interface TurnstileWidgetProps {
  /** Called with the token when the challenge solves; called with "" on expiry/error. */
  onToken: (token: string) => void;
}

/**
 * Cloudflare Turnstile invisible widget. Renders nothing visible until the
 * Turnstile script loads and `window.turnstile.render` is called.
 *
 * If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is not set (dev without keys), the
 * widget silently no-ops — it neither loads the script nor renders.
 */
export function TurnstileWidget({ onToken }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !ref.current) return;

    function renderWidget() {
      if (rendered.current || !window.turnstile || !ref.current) return;
      rendered.current = true;
      window.turnstile.render(ref.current, {
        sitekey: siteKey!,
        callback: (t) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector(
      `script[src="${SCRIPT_SRC}"]`
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", renderWidget);
      return;
    }

    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = renderWidget;
    document.head.appendChild(s);
  }, [onToken]);

  return <div ref={ref} className="cf-turnstile" />;
}
