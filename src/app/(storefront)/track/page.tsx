"use client";

import { useState, type FormEvent } from "react";

/**
 * Official J&T Express Philippines tracking URL.
 *
 * Verified 2026-05-28 against public search-result evidence for the live tracker
 * (e.g. `https://www.jtexpress.ph/index/query/gzquery.html?bills=1635015099` —
 * a real tracking number in the URL). The page renders client-side, so we cannot
 * inspect its HTML over WebFetch; this is the format J&T PH currently exposes
 * publicly. Update if J&T changes its public URL/param.
 */
const JT_TRACK_URL = "https://www.jtexpress.ph/index/query/gzquery.html";
const JT_TRACK_PARAM = "bills";

export default function TrackPage() {
  const [value, setValue] = useState("");
  const [showHint, setShowHint] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = value.trim();
    if (!code) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    const url = `${JT_TRACK_URL}?${JT_TRACK_PARAM}=${encodeURIComponent(code)}`;
    // Same-tab redirect — Facebook in-app browser cannot handle window.open / target=_blank.
    window.location.assign(url);
  }

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="mb-3 text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        Track My Order
      </h1>
      <p className="mb-6 max-w-md text-text-secondary">
        Enter the tracking number we texted you to follow your order on
        J&amp;T&apos;s official tracker.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex max-w-md flex-col gap-3"
        noValidate
      >
        <label htmlFor="tracking-number" className="sr-only">
          J&amp;T tracking number
        </label>
        <input
          id="tracking-number"
          name="trackingNumber"
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (showHint) setShowHint(false);
          }}
          placeholder="J&T tracking number"
          autoComplete="off"
          inputMode="text"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary focus:border-brand-accent focus:outline-none"
        />
        {showHint && (
          <p
            role="alert"
            className="text-sm text-text-secondary"
          >
            Enter your tracking number to continue.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-brand-darkest px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Track on J&amp;T
        </button>
      </form>
    </div>
  );
}
