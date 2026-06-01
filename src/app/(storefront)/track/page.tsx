"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCopy } from "@/lib/lang-context";

/**
 * Official J&T Express Philippines tracking URL — links DIRECT to the tracking result.
 *
 * Updated 2026-05-29 (client request: send buyers straight to the tracking result,
 * not the J&T landing/search page). The live tracker deep-links via
 * `https://www.jtexpress.ph/trajectoryQuery?waybillNo=<wb>&flag=1` (public
 * search-result evidence, e.g. `waybillNo=941351660566&flag=1`). The tracker renders
 * client-side, so its HTML can't be inspected over WebFetch — verify the live URL
 * with a real waybill if J&T changes its public URL/param.
 */
const JT_TRACK_URL = "https://www.jtexpress.ph/trajectoryQuery";
const JT_TRACK_PARAM = "waybillNo";

export default function TrackPage() {
  const copy = useCopy();
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
    const url = `${JT_TRACK_URL}?${JT_TRACK_PARAM}=${encodeURIComponent(code)}&flag=1`;
    // Same-tab redirect — Facebook in-app browser cannot handle window.open / target=_blank.
    window.location.assign(url);
  }

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="mb-3 text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        {copy.track.title}
      </h1>
      <p className="mb-6 max-w-md text-text-secondary">{copy.track.help}</p>
      <form
        onSubmit={handleSubmit}
        className="flex max-w-md flex-col gap-3"
        noValidate
      >
        <label htmlFor="tracking-number" className="sr-only">
          {copy.track.waybill}
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
          placeholder={copy.track.waybill}
          autoComplete="off"
          inputMode="text"
          className="h-11 w-full rounded-md border border-border bg-surface px-3 text-base text-text-primary focus:border-brand-accent focus:outline-none"
        />
        {showHint && (
          <p
            role="alert"
            className="text-sm text-text-secondary"
          >
            {copy.errors.trackEnterNumber}
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-brand-darkest px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {copy.track.trackOnJt}
        </button>
      </form>
      <p className="mt-4 max-w-md text-sm text-text-secondary">
        {copy.track.noTrackingYet}{" "}
        <Link
          href="/lookup"
          className="font-semibold text-brand-darkest underline underline-offset-4 hover:text-brand-dark"
        >
          {copy.track.lookup}
        </Link>
      </p>
    </div>
  );
}
