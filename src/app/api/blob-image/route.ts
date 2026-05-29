import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for private Vercel Blob images — serves them publicly via
 * /api/blob-image?url=...
 *
 * SSRF hardening (red-team R1, fix #1):
 *   1. The incoming `url` is validated to be a well-formed HTTPS Vercel Blob URL.
 *   2. When `BLOB_STORE_ID` is set we require an EXACT host match against THIS
 *      store's host (`<id>.public.blob.vercel-storage.com` /
 *      `<id>.blob.vercel-storage.com`) — a foreign `*.blob.vercel-storage.com`
 *      host (an attacker's own store, or a cross-tenant public blob) is rejected.
 *   3. We then call `get(pathname, { access: "private" })` with the PATHNAME
 *      form, never the attacker-controlled URL. The library reconstructs the
 *      host from the RW token's own store, so the host can't be steered even if
 *      the suffix/exact checks were somehow bypassed.
 */
export async function GET(request: NextRequest) {
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
  // (public) or `<id>.blob.vercel-storage.com` (private). The app stores
  // private blobs, but accept either form belonging to this store. Compare
  // lowercased on both sides (hostnames are case-insensitive).
  const storeId = process.env.BLOB_STORE_ID?.toLowerCase();
  if (storeId) {
    const allowedHosts = [
      `${storeId}.public.blob.vercel-storage.com`,
      `${storeId}.blob.vercel-storage.com`,
    ];
    if (!allowedHosts.includes(hostname)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
    }
  }

  // Reconstruct from pathname so the host is the token's store, not the input.
  const pathname = parsed.pathname.slice(1);
  if (!pathname) {
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
