import { NextRequest, NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * Reverse-geocoding proxy for Nominatim (OpenStreetMap).
 *
 * Why a proxy? Nominatim's fair-use policy requires a real `User-Agent`
 * header on every request. Browser `fetch` is forbidden by spec from setting
 * the UA header — so a server hop is the only correct way to use the API
 * from a static-ish web app. This route attaches the UA + Referer and
 * forwards the JSON response unchanged.
 *
 * Rate-limiting safeguard: only the checkout's "Use my location" button
 * triggers this, one request per tap. No auto-trigger on page load.
 * Per-IP limits below match Nominatim's published policy (1 req/sec).
 *
 * IMPORTANT: The limiter state is in-memory and module-scoped — it does NOT
 * survive Vercel cold starts and does NOT coordinate across serverless
 * instances. That's acceptable here as a defense against casual abuse from
 * a single client; for production-grade protection layer a Cloudflare WAF
 * rule (or Upstash Redis) on top.
 */

const USER_AGENT = "Noel-AgriTV-Checkout/1.0 (https://noelagritv.com)";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";

// 1 req/sec/IP, 30 req/min/IP — within Nominatim's usage policy headroom.
const limiter = createRateLimiter({
  intervalMs: 1000,
  windowMs: 60_000,
  maxPerWindow: 30,
});

function isValidCoord(v: number, min: number, max: number) {
  return Number.isFinite(v) && v >= min && v <= max;
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  // Skip rate-limiting in non-production. `x-forwarded-for` is set by Vercel
  // in production; locally it's absent, so every dev request shares the
  // `"unknown"` bucket and the 1-req/sec rule trips on the second click.
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

  const sp = request.nextUrl.searchParams;
  const latStr = sp.get("lat");
  const lonStr = sp.get("lon");
  if (!latStr || !lonStr) {
    return NextResponse.json(
      { error: "Missing lat or lon" },
      { status: 400 }
    );
  }
  const lat = Number(latStr);
  const lon = Number(lonStr);
  if (!isValidCoord(lat, -90, 90) || !isValidCoord(lon, -180, 180)) {
    return NextResponse.json(
      { error: "lat must be in [-90, 90] and lon in [-180, 180]" },
      { status: 400 }
    );
  }

  // Build Nominatim URL with English locale + structured address details.
  const url =
    `${NOMINATIM_BASE}?lat=${encodeURIComponent(lat.toString())}` +
    `&lon=${encodeURIComponent(lon.toString())}` +
    `&format=jsonv2&addressdetails=1&accept-language=en`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Referer: "https://noelagritv.com/checkout",
        Accept: "application/json",
      },
      // Don't cache — coords change per user.
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream geocoder responded ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    // Pass the response through unchanged — the client maps fields itself.
    return NextResponse.json(data, {
      headers: {
        // Don't let intermediaries cache user locations.
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("/api/geocode upstream error:", e);
    return NextResponse.json(
      { error: "Upstream geocoder unreachable" },
      { status: 502 }
    );
  }
}
