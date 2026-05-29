<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

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

2. **Cloudflare WAF rate-rule on the POST path (RECOMMENDED — not yet configured).** Add a WAF rate-limiting rule in the Cloudflare dashboard that throttles POSTs to the order-lookup endpoint per source IP (suggested starting point: ~10 requests/min/IP, challenge or block on exceed). This is the cross-instance ceiling the in-process limiter cannot provide. Apply the same to `/checkout` submission and the `/api/geocode` proxy. Configure in Cloudflare, not in app code — keep the distributed limiter out of v1 (no Redis). Server-Action POSTs hit the route the page is served from, so scope the rule by method=POST + path prefix rather than expecting a dedicated URL.

