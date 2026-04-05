import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Check if token exists
  results.hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  results.tokenPrefix = process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 20) + "...";

  // Test 2: Try listing blobs
  try {
    const { blobs } = await list({ limit: 5 });
    results.listSuccess = true;
    results.blobCount = blobs.length;
    results.blobs = blobs.map((b) => ({ pathname: b.pathname, url: b.url.slice(0, 60) }));
  } catch (e) {
    results.listSuccess = false;
    results.listError = e instanceof Error ? e.message : String(e);
  }

  // Test 3: Try writing a test blob (public access)
  try {
    const blob = await put("debug/test.json", JSON.stringify({ test: true }), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    results.putPublicSuccess = true;
    results.putPublicUrl = blob.url;
    // Clean up
    await del(blob.url);
  } catch (e) {
    results.putPublicSuccess = false;
    results.putPublicError = e instanceof Error ? e.message : String(e);
  }

  // Test 4: Try writing a test blob (private access)
  try {
    const blob = await put("debug/test-private.json", JSON.stringify({ test: true }), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    results.putPrivateSuccess = true;
    results.putPrivateUrl = blob.url;
    // Clean up
    await del(blob.url);
  } catch (e) {
    results.putPrivateSuccess = false;
    results.putPrivateError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(results, { status: 200 });
}
