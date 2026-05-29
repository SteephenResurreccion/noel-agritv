"use client";

import { useState, useTransition, type FormEvent } from "react";
import { MESSENGER_URL } from "@/lib/constants";
import { lookupSchema, type LookupResult } from "@/lib/lookup";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { lookupOrder } from "./actions";

/**
 * Buyer self-service lookup form.
 *
 * The buyer enters their order # and the last 4 digits of the phone they used
 * at checkout. An invisible Cloudflare Turnstile widget (same component + props
 * as `/checkout`) solves in the background and supplies a token; the server
 * action verifies it before reading the sheet, raising the bot cost of order
 * enumeration. Zero friction for a real buyer — they never see a challenge.
 *
 * On submit:
 *   - Local schema check (zod) — fast feedback, no server hop on bad input.
 *   - Server action does the work + privacy-sanitizes the response.
 *   - Three result branches:
 *       1. Found — show status, items, subtotal/shipping, and either a
 *          "Track on J&T" button (if booked) or a "we'll text you" notice
 *          + Messenger CTA (not booked yet).
 *       2. Not found / sheets fail / rate limited — show the action's
 *          message + Messenger CTA.
 *
 * IAB-safe: J&T + Messenger links use bare `<a href>` (same-tab). The Facebook
 * in-app browser ignores `window.open` and `target="_blank"`.
 */

// Same constant as `/track/page.tsx` — public J&T PH tracker. Update here if
// J&T changes the URL/param (see /track/page.tsx for verification notes).
const JT_TRACK_URL = "https://www.jtexpress.ph/index/query/gzquery.html";
const JT_TRACK_PARAM = "bills";

export interface LookupFormProps {
  /** Pre-fill from `?order=` query param on the confirmation cross-link. */
  initialOrderNumber: string;
}

type FieldErrors = Partial<Record<"orderNumber" | "phoneLast4", string>>;

const LABEL_CLASS = "block text-sm font-medium text-text-primary";
const INPUT_CLASS =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary placeholder:text-text-disabled focus:border-brand-mid focus:outline-none focus:ring-1 focus:ring-brand-mid";
const ERROR_CLASS = "mt-1 text-sm text-destructive";

export function LookupForm({ initialOrderNumber }: LookupFormProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phoneLast4, setPhoneLast4] = useState("");
  const [token, setToken] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<LookupResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult(null);
    const payload = {
      orderNumber: orderNumber.trim().toUpperCase(),
      phoneLast4: phoneLast4.trim(),
      turnstileToken: token,
    };
    const parsed = lookupSchema.safeParse(payload);
    if (!parsed.success) {
      // Pull out the first error per field for the inline message. The
      // turnstileToken field isn't surfaced inline (the submit button is
      // gated on `!token`, so a real submit always carries one); it stays in
      // the schema so the server re-validates the same shape.
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const res = await lookupOrder(parsed.data);
      // Reset the token on a failed Turnstile verify so the widget re-solves
      // before the next attempt (mirrors `submitOrder` handling in checkout).
      if (!res.ok && res.error === "turnstile") setToken("");
      setResult(res);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="max-w-md space-y-4" noValidate>
        <div>
          <label htmlFor="lookup-order" className={LABEL_CLASS}>
            Order number
          </label>
          <input
            id="lookup-order"
            name="orderNumber"
            type="text"
            required
            autoComplete="off"
            placeholder="NAG-YYYYMMDD-XXXX"
            value={orderNumber}
            onChange={(e) => {
              setOrderNumber(e.target.value);
              if (errors.orderNumber) {
                setErrors((p) => ({ ...p, orderNumber: undefined }));
              }
            }}
            aria-invalid={errors.orderNumber ? "true" : "false"}
            aria-describedby={
              errors.orderNumber ? "lookup-order-error" : undefined
            }
            className={INPUT_CLASS}
          />
          {errors.orderNumber && (
            <p
              id="lookup-order-error"
              role="alert"
              className={ERROR_CLASS}
            >
              {errors.orderNumber}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lookup-phone" className={LABEL_CLASS}>
            Last 4 digits of your phone
          </label>
          <input
            id="lookup-phone"
            name="phoneLast4"
            type="text"
            required
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            placeholder="1234"
            value={phoneLast4}
            onChange={(e) => {
              setPhoneLast4(e.target.value.replace(/\D/g, ""));
              if (errors.phoneLast4) {
                setErrors((p) => ({ ...p, phoneLast4: undefined }));
              }
            }}
            aria-invalid={errors.phoneLast4 ? "true" : "false"}
            aria-describedby={
              errors.phoneLast4 ? "lookup-phone-error" : undefined
            }
            className={INPUT_CLASS}
          />
          {errors.phoneLast4 && (
            <p
              id="lookup-phone-error"
              role="alert"
              className={ERROR_CLASS}
            >
              {errors.phoneLast4}
            </p>
          )}
        </div>
        {/* Invisible Turnstile — same widget/props as checkout. Renders nothing
            visible; supplies the token consumed above. IAB-safe (no popup). */}
        <TurnstileWidget onToken={setToken} />

        <button
          type="submit"
          disabled={isPending || !token}
          className="min-h-11 w-full rounded-md bg-brand-darkest px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
        >
          {isPending ? "Looking up…" : "Find my order"}
        </button>
      </form>

      {result && <LookupResultPanel result={result} />}
    </div>
  );
}

function LookupResultPanel({ result }: { result: LookupResult }) {
  if (!result.ok) {
    return (
      <div
        role="alert"
        className="max-w-md rounded-md border border-border bg-surface p-4 text-sm text-text-primary"
      >
        <p>{result.message}</p>
        <a
          href={MESSENGER_URL}
          className="mt-3 inline-block min-h-11 rounded-md bg-brand-accent px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Message us on Messenger
        </a>
      </div>
    );
  }

  const s = result.summary;
  const trackHref = s.trackingNumber
    ? `${JT_TRACK_URL}?${JT_TRACK_PARAM}=${encodeURIComponent(s.trackingNumber)}`
    : "";

  return (
    <div className="max-w-md rounded-md border border-brand-mid bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-mono text-text-secondary">
          {s.orderNumber}
        </p>
        <span className="inline-block rounded-full bg-brand-darkest px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {s.status}
        </span>
      </div>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-semibold text-text-primary">Items</dt>
          <dd className="text-text-secondary">{s.itemsLine}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold text-text-primary">Subtotal</dt>
          <dd className="text-text-primary">{s.subtotal}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold text-text-primary">Shipping</dt>
          <dd className="text-text-primary">{s.shipping}</dd>
        </div>
      </dl>

      {s.trackingNumber ? (
        <a
          href={trackHref}
          className="mt-5 block min-h-11 rounded-md bg-brand-accent px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-90"
        >
          Track shipment on J&amp;T →
        </a>
      ) : (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-text-secondary">
            Your order is confirmed. We&apos;ll text you the tracking number
            once it&apos;s booked with J&amp;T.
          </p>
          <a
            href={MESSENGER_URL}
            className="block min-h-11 rounded-md border border-border bg-surface px-5 py-3 text-center text-sm font-semibold text-brand-darkest hover:bg-bg-wheat"
          >
            Message us
          </a>
        </div>
      )}
    </div>
  );
}
