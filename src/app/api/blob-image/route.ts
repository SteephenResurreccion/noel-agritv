import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/** Proxy for private Vercel Blob images — serves them publicly via /api/blob-image?url=... */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate URL points to Vercel Blob storage (prevent SSRF)
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname.endsWith(".blob.vercel-storage.com") ||
      parsed.hostname === "blob.vercel-storage.com"
    ) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const result = await get(url, { access: "private" });
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
