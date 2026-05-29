import { Suspense } from "react";
import { LookupForm } from "./lookup-form";

/**
 * Buyer self-service order lookup.
 *
 * Cross-linked from:
 *   - `/checkout/confirmation?order=NAG-...` ("Check status any time")
 *   - `/track`                                ("Don't have a tracking number?")
 *
 * The page is a server component (cheap, cacheable shell). The form below is
 * a client component that calls the `lookupOrder` server action.
 *
 * `?order=NAG-...` arrives via `searchParams` (Next 16 — async prop). We pre-
 * fill the order # input on the client so the buyer only types the phone tail.
 *
 * Wrapped in <Suspense> because Next 16 routes that read searchParams are
 * dynamic and the page itself should still stream the static shell.
 */

interface LookupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LookupPage({ searchParams }: LookupPageProps) {
  const params = await searchParams;
  const raw = params.order;
  const initialOrderNumber = typeof raw === "string" ? raw : "";

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="mb-3 text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        Find my order
      </h1>
      <p className="mb-6 max-w-md text-text-secondary">
        Enter your order number and the last 4 digits of the phone number you
        used at checkout to see your order status.
      </p>
      <Suspense
        fallback={
          <p className="text-text-secondary">Loading lookup form…</p>
        }
      >
        <LookupForm initialOrderNumber={initialOrderNumber} />
      </Suspense>
    </div>
  );
}
