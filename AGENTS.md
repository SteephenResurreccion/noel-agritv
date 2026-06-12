<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Two stack facts agents reliably get wrong here:
- **Route params are Promises** in this Next version — `await params` / `await searchParams` in pages, layouts, and route handlers.
- **UI primitives are `@base-ui/react`** (shadcn CLI v4) — NOT Radix. There are zero `@radix-ui` dependencies; don't import or install them.

## Design conventions — MOBILE-FIRST

**This storefront is mobile-first.** The primary user is a Filipino farmer on a budget Android phone over 3G. Build and verify every UI change at 390px FIRST, then adapt upward. Desktop is secondary: when a desktop layout fights long content, simplify/restructure the desktop layout — never compromise the mobile experience and never shorten client-approved copy to fix a desktop problem.

- The storefront's mobile↔desktop chrome split is **`lg:` (1024px), not `md:`** — header, drawer, mobile-bottom-bar, footer/checkout-bar clearance, and the globals.css cart-clearance media query all key off `lg:`. Any new mobile-chrome element must too.
- Touch targets: **≥48x48px** on anything tappable (the button's own hit area — container padding does not count).
- **Layout-check both languages.** Filipino strings run ~40% longer than English; a layout that only works in one language is broken. Verify FIL and EN at 390px and 1024px+ before calling UI work done.

## Spec deviations from 2026-05-21

The live COD checkout has diverged from the original 2026-05-21 spec in three places. Future agents should treat the running code as canonical; these notes exist so the divergences don't read as bugs.

**PSGC cascading dropdowns instead of plain text inputs.** `/checkout` renders Region → Province → City → Barangay as cascading `<select>` elements (`src/components/address-fields.tsx`) rather than the spec's text fields. The PSGC data comes from the public-domain `flores-jacob/philippine-regions-provinces-cities-municipalities-barangays` dataset, split per-region into `/public/data/psgc/<region>.json` (~15–20 KB gzipped each) and lazy-loaded only after the user picks a region — so first-load JS stays inside the 150KB budget. Street and Landmark remain free-text inputs.

**"Use my location" button with Nominatim reverse-geocode.** A geolocate button (`src/components/geolocate-button.tsx`) calls the browser geolocation API and best-effort pre-fills the dropdowns via `/api/geocode`, which proxies Nominatim with `User-Agent: Noel-AgriTV-Checkout/1.0 (https://noelagritv.com)`. The proxy enforces a per-IP rate limit (1 req/sec, 30 req/min, in-memory) to stay inside Nominatim's usage policy; the limiter is module-scoped and does not survive Vercel cold starts, so put a Cloudflare WAF rule or Upstash bucket in front before relying on it under attack load.

**Sticky bottom checkout bar on storefront pages.** When the cart has items, a sticky bar (cream `bg-surface` + gold `bg-brand-accent` CTA) is mounted from `src/app/(storefront)/layout.tsx` and shows on storefront pages only. It hides itself on `/cart`, `/checkout/*`, and any `/admin/*` route to avoid covering the page-level CTAs there.

## Security hardening

**Bot/abuse defense is layered; the in-process rate limiter is NOT a real control.** `src/lib/rate-limit.ts` is module-scoped — it does not survive Vercel cold starts and does not coordinate across serverless instances, so it cannot stop a botnet or a client that keeps hitting freshly-spun lambdas. Treat it as a single-warm-instance speed bump only.

The two real defenses for abuse-prone POST endpoints are:

1. **Invisible Cloudflare Turnstile on the server action** — verified server-side via `verifyTurnstile` (`src/lib/turnstile.ts`, reads `TURNSTILE_SECRET_KEY`) before any data access. Already wired into:
   - `/checkout` → `submitOrder` (before the Sheets append).
   - `/lookup` → `lookupOrder` (before the Sheets read) — added to raise the bot cost of order-status enumeration (order # + last-4-phone). The widget (`src/components/turnstile-widget.tsx`) is invisible and adds zero buyer friction; IAB-safe (no popup, same-tab).
   - Any new POST that reads or mutates buyer data should mount the same `TurnstileWidget` and call `verifyTurnstile` first.

2. **Cloudflare WAF rate-rule on the abuse-prone paths (RECOMMENDED — not yet configured).** Add WAF rate-limiting rules in the Cloudflare dashboard (suggested starting point: ~10 requests/min/IP on order paths, challenge or block on exceed). This is the cross-instance ceiling the in-process limiter cannot provide. Method scoping matters: `/checkout` and `/lookup` mutations are Server-Action **POSTs to the page's own path** (scope by method=POST + path prefix — there is no dedicated URL), while the `/api/geocode` and `/api/blob-image` route handlers only export **GET** — a POST-scoped rule there matches nothing, so give them GET-scoped rules (blob-image needs a much higher threshold than 10/min: it serves every product image, and a challenge on an `<img>` GET is unsolvable — block at a generous rate instead). Configure in Cloudflare, not in app code — keep the distributed limiter out of v1 (no Redis).

