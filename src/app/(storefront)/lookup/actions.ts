"use server";

import { headers } from "next/headers";
import { createRateLimiter } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  lookupSchema,
  findOrderInRows,
  summarizeRow,
  type LookupResult,
} from "@/lib/lookup";
import { fetchAllOrderRows } from "@/lib/sheets-read";
import { copy } from "@/lib/copy";

/**
 * Buyer self-service order lookup.
 *
 * Pipeline:
 *   1. Re-validate input via `lookupSchema` (client already validates, but
 *      server actions must never trust client-side checks).
 *   2. Verify the Cloudflare Turnstile token server-side via `verifyTurnstile`
 *      — the SAME helper `submitOrder` uses — BEFORE any sheet read. This is
 *      the real cross-instance barrier against order enumeration; the in-process
 *      rate limiter below is only best-effort (does not survive serverless cold
 *      starts / multiple instances — see `@/lib/rate-limit`).
 *   3. Rate-limit per IP — module-scoped limiter, dev-bypassed (matches the
 *      pattern in `/api/geocode`, commit ee458d5). The "unknown" bucket would
 *      otherwise trip the 1-req/sec rule on every dev request.
 *   4. Read all rows from the Orders sheet (30s in-memory cache absorbs F5
 *      mashing) and scan for the order # + phone-tail match.
 *   5. On hit → return only the buyer-visible columns (status / items /
 *      shipping / tracking #). Never leak name, phone, address, or notes.
 *
 * Error mapping → form UI:
 *   - `validation`     → schema mismatch (defensive; client guards this).
 *   - `turnstile`      → anti-spam check failed → "please retry" (re-solves).
 *   - `rate_limited`   → too many lookups, please wait.
 *   - `not_found`      → no row matches → "double-check or message us".
 *   - `sheets`         → upstream/auth blew up → "we can't reach the log".
 */

// 1 req/sec/IP, 30 req/min/IP — generous for a buyer manually retrying.
const limiter = createRateLimiter({
  intervalMs: 1000,
  windowMs: 60_000,
  maxPerWindow: 30,
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function lookupOrder(payload: unknown): Promise<LookupResult> {
  // 1. Re-validate.
  const parsed = lookupSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: "validation",
      message: copy.errors.lookupFormCheck,
    };
  }

  // 2. Turnstile (server-side) — same helper + ordering as `submitOrder`.
  //    This runs BEFORE the sheet read so a bot can't enumerate orders without
  //    first solving a challenge. It is the real cross-instance barrier; the
  //    rate limiter below is only best-effort on a single warm instance.
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return {
      ok: false,
      error: "turnstile",
      message: copy.common.antiSpam,
    };
  }

  // 3. Rate-limit (production only — dev shares the "unknown" bucket).
  if (process.env.NODE_ENV === "production") {
    const rl = limiter.check(await clientIp());
    if (!rl.allowed) {
      return {
        ok: false,
        error: "rate_limited",
        message: copy.errors.tooManyLookups,
      };
    }
  }

  // 4. Read the sheet (cache absorbs burst traffic).
  let rows: string[][];
  try {
    rows = await fetchAllOrderRows();
  } catch (e) {
    console.error("lookupOrder: sheets read failed", e);
    return {
      ok: false,
      error: "sheets",
      message: copy.errors.logUnreachable,
    };
  }

  // 5. Match → summarize (privacy-sanitized).
  const hit = findOrderInRows(rows, parsed.data.orderNumber, parsed.data.phoneLast4);
  if (!hit) {
    return {
      ok: false,
      error: "not_found",
      message: copy.errors.orderNotFound,
    };
  }
  return { ok: true, summary: summarizeRow(hit) };
}
