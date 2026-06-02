import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Proxy for private Vercel Blob images — serves them publicly via
 * /api/blob-image?url=...
 *
 * SSRF hardening (red-team R1, fix #1):
 *   1. The incoming `url` is validated to be a well-formed HTTPS Vercel Blob URL.
 *   2. When `BLOB_STORE_ID` is set we require an EXACT host match against THIS
 *      store's host (`<id>.public.blob.vercel-storage.com`,
 *      `<id>.private.blob.vercel-storage.com`, or `<id>.blob.vercel-storage.com`)
 *      — a foreign `*.blob.vercel-storage.com` host (an attacker's own store,
 *      or a cross-tenant public blob) is rejected.
 *   3. We then call `get(pathname, { access: "private" })` with the PATHNAME
 *      form, never the attacker-controlled URL. The library reconstructs the
 *      host from the RW token's own store, so the host can't be steered even if
 *      the suffix/exact checks were somehow bypassed.
 *
 * Path allowlist (red-team R3, CRITICAL): the proxy is unauthenticated and
 * `admin/config.json` (PII) lives at a fixed key in this same store, so the
 * pathname must start with `products/` or `videos/` — the only prefixes the app
 * legitimately proxies — before `get()` is called. Path traversal is rejected.
 *
 * Egress-abuse safeguard (rate-abuse-1): this is the most-hit unauthenticated
 * endpoint and streams up to 5 MB out of metered Vercel Blob per GET. Valid
 * `?url=` values sit in plain HTML on every product page, so they are trivially
 * harvested and looped — a free Blob/function egress amplifier. We add a per-IP
 * limiter as a single-instance speed bump (mirrors `/api/geocode`). It is NOT a
 * real ceiling: the limiter is module-scoped, dies on cold starts, and does not
 * coordinate across lambdas, and an attacker can spread across IPs. The durable
 * fixes live outside app code — a Cloudflare edge-cache + WAF rate-rule on
 * `/api/blob-image` (the response is already `immutable`, so the CDN fully
 * absorbs repeats), per AGENTS.md. We also normalize the cache key by ignoring
 * every query param except `url`, so `&x=<rand>` noise can't fragment caching.
 */

// 1 req/sec/IP, 60 req/min/IP — image pages legitimately fire several proxy
// GETs in a burst (one per product image), so allow more headroom than the
// geocoder's one-tap path while still capping a tight abuse loop.
const limiter = createRateLimiter({
  intervalMs: 0,
  windowMs: 60_000,
  maxPerWindow: 60,
});

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  );
}

export async function GET(request: NextRequest) {
  // Skip rate-limiting in non-production. `x-forwarded-for` is set by Vercel in
  // production; locally it's absent, so every dev request shares the `"unknown"`
  // bucket and the cap trips on otherwise-legitimate page loads.
  if (process.env.NODE_ENV === "production") {
    const rl = limiter.check(clientIp(request));
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(rl.retryAfterSec),
        },
      });
    }
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Must be HTTPS and a Vercel Blob host, never the apex. URL parsing already
  // lowercases the hostname, but normalize defensively for the comparisons.
  const hostname = parsed.hostname.toLowerCase();
  const isVercelBlobHost =
    hostname.endsWith(".blob.vercel-storage.com") &&
    hostname !== "blob.vercel-storage.com";
  if (parsed.protocol !== "https:" || !isVercelBlobHost) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  // Bind to THIS store: when BLOB_STORE_ID is configured, require an exact
  // host match. Vercel Blob hosts are `<id>.public.blob.vercel-storage.com`
  // (public) or `<id>.private.blob.vercel-storage.com` (private); the legacy
  // `<id>.blob.vercel-storage.com` form is also accepted. The app stores
  // private blobs (`put(..., { access: "private" })` returns the `.private.`
  // host), but accept any form belonging to this store. Compare lowercased on
  // both sides (hostnames are case-insensitive).
  const storeId = process.env.BLOB_STORE_ID?.toLowerCase();
  if (storeId) {
    const allowedHosts = [
      `${storeId}.public.blob.vercel-storage.com`,
      `${storeId}.private.blob.vercel-storage.com`,
      `${storeId}.blob.vercel-storage.com`,
    ];
    if (!allowedHosts.includes(hostname)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
    }
  }

  // Reconstruct from pathname so the host is the token's store, not the input.
  const pathname = parsed.pathname.replace(/^\/+/, "");
  if (!pathname) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  // Path allowlist (red-team R3, CRITICAL): the proxy is unauthenticated and the
  // private `admin/config.json` (manager emails = PII, shipping, hidden products)
  // sits at a fixed key in the SAME store. Without a path gate, an anonymous
  // attacker can request `?url=https://<storeId>.blob.vercel-storage.com/admin/config.json`
  // and stream the entire admin config. Restrict to the only prefixes the app
  // legitimately proxies (`products/`, `videos/`) and reject path traversal.
  if (!/^(products|videos)\//.test(pathname) || pathname.includes("..")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Handle 304 Not Modified (stream is null)
    if (result.statusCode === 304 || !result.stream) {
      return new Response(null, { status: 304 });
    }

    const contentType = result.blob.contentType ?? "image/jpeg";

    return new Response(result.stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error("blob-image proxy error:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
