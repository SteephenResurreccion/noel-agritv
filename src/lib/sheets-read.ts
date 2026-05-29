import { JWT } from "google-auth-library";

/**
 * Sheets READ helper — server-only. Mirrors the auth flow in `sheets.ts` so
 * the same service-account JWT credentials work for both append and read.
 *
 * Server-only by convention: `google-auth-library` ships node primitives
 * (crypto, fs) that would either break the bundle or leak the service-account
 * JWT to the client. Import this module ONLY from server actions, route
 * handlers, or server components — never from a `"use client"` file.
 *
 * 30-second in-memory cache: a buyer mashing F5 on `/lookup` is the realistic
 * abuse vector. Sheets API quota is generous but the round-trip is ~300ms; a
 * single hit per 30s window absorbs the burst and keeps the page snappy.
 * Cache is module-scoped — it does NOT survive a Vercel cold start, which is
 * fine: each instance gets its own warm cache after the first request.
 */

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TAB = "Orders";
const RANGE = "A:Q";
const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  rows: string[][];
  fetchedAt: number;
}
let cache: CacheEntry | null = null;

/**
 * Read `Orders!A:Q` and return the row arrays. First row may be the header;
 * downstream callers handle that themselves so this stays a thin transport
 * layer.
 *
 * Caches the result for 30 seconds. Throws on any auth / network / non-OK
 * upstream — the calling server action catches and maps to a user-facing
 * error code.
 */
export async function fetchAllOrderRows(): Promise<string[][]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rows;
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Vercel stores multiline keys with literal "\n" — restore real newlines.
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!sheetId || !email || !key) {
    throw new Error("Google Sheets env vars not configured");
  }

  const jwt = new JWT({ email, key, scopes: [SHEETS_SCOPE] });
  const { token } = await jwt.getAccessToken();
  if (!token) throw new Error("Failed to obtain Google access token");

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}` +
    `/values/${encodeURIComponent(TAB)}!${RANGE}?majorDimension=ROWS`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    // Don't let Next's fetch cache the response — we run our own TTL above.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Sheets read failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { values?: string[][] };
  const rows = body.values ?? [];
  cache = { rows, fetchedAt: now };
  return rows;
}

/** Test helper — wipe the cache so suites don't bleed into each other. */
export function __resetSheetsReadCacheForTests() {
  cache = null;
}
