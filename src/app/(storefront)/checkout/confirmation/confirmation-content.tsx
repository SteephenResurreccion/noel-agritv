"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { useCopy } from "@/lib/lang-context";

export function ConfirmationContent() {
  const copy = useCopy();
  const params = useSearchParams();
  const order = params.get("order") ?? "";
  const [copied, setCopied] = useState(false);
  // Defensive safety-net: the checkout form clears the cart before navigating,
  // but if a user reaches this page via direct URL, clear here too. Idempotent.
  useEffect(() => {
    useCart.getState().clear();
  }, []);

  async function handleCopy() {
    if (!order) return;
    try {
      // Clipboard API requires a secure context (https/localhost) — both apply
      // on Vercel and `next dev`. Fall back silently on the unlikely failure.
      await navigator.clipboard.writeText(order);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No-op — the order # is still on-screen for manual copy.
    }
  }

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
          {copy.confirmation.received}
        </h1>
        <p className="mt-3 text-text-secondary">
          {copy.confirmation.teamWillContact}
        </p>

        {order && (
          <div className="mt-6 rounded-md border border-brand-mid bg-surface p-5 text-left">
            <p className="text-sm font-semibold text-text-secondary">
              {copy.confirmation.save}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-lg font-semibold text-brand-darkest break-all">
                {order}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copy.confirmation.copyAriaLabel}
                className="min-h-11 shrink-0 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-text-primary hover:bg-bg-wheat"
              >
                {copied ? copy.confirmation.copied : copy.confirmation.copy}
              </button>
            </div>
            <Link
              href={`/lookup?order=${encodeURIComponent(order)}`}
              className="mt-4 inline-block text-sm font-semibold text-brand-darkest underline underline-offset-4 hover:text-brand-dark"
            >
              {copy.confirmation.checkStatus}
            </Link>
          </div>
        )}

        <Link
          href="/products"
          className="mt-6 inline-block min-h-11 rounded-md bg-brand-darkest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {copy.common.continueShopping}
        </Link>
      </div>
    </div>
  );
}
