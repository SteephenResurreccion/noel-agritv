import { head } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CONTENT_TYPES = [
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/avif",
];

/** Proxy for private Vercel Blob images — serves them publicly via /api/blob-image?url=... */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Validate URL points to OUR Vercel Blob store (prevent SSRF / cross-tenant access)
  const storeId = process.env.BLOB_STORE_ID;
  try {
    const parsed = new URL(url);
    if (storeId) {
      if (parsed.hostname !== `${storeId}.blob.vercel-storage.com`) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
      }
    } else {
      if (
        !parsed.hostname.endsWith(".blob.vercel-storage.com") ||
        parsed.hostname === "blob.vercel-storage.com"
      ) {
        return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
      }
    }
    if (parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Verify the blob exists and get metadata
    const meta = await head(url);
    if (!meta) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = meta.contentType ?? "image/webp";
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 403 });
    }

    // Fetch the actual blob content using the downloadUrl (works for private blobs)
    const downloadUrl = meta.downloadUrl;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
