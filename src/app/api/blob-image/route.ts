import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

/** Proxy for private Vercel Blob images — serves them publicly via /api/blob-image?url=... */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const result = await get(url, { access: "private" });
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
