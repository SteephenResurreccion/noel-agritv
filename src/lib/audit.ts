import { JWT } from "google-auth-library";
import { sanitizeCell } from "@/lib/sheets";

/**
 * One append-only admin audit record.
 *
 * - `actor`   — the admin's email (or "unknown" if the session has none).
 * - `action`  — a FIXED, server-authored code (e.g. "PRODUCT_ADD"). Never
 *               buyer- or admin-typed free text, so it is written verbatim and
 *               is deliberately NOT passed through `sanitizeCell` (see below).
 * - `target`  — the object the action touched (a product slug, a video URL, a
 *               manager email …). Server-derived but sanitized defensively.
 * - `summary` — a human-readable one-liner for the morning auditor.
 */
export interface AuditEntry {
  actor: string;
  action: string;
  target: string;
  summary: string;
}

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/**
 * Append-only audit tab living in the SAME Orders spreadsheet (same
 * GOOGLE_SHEET_ID). The owner creates this tab manually before go-live with the
 * header row `Timestamp | Actor | Action | Target | Summary` — there is NO
 * auto-create in v1 (it cannot be smoke-tested against the live book overnight).
 * If the tab is missing, Google returns HTTP 400 ("Unable to parse range:
 * AuditLog!A1") → this fn throws → the caller's after()+catch swallows it, so a
 * missing tab degrades gracefully and never fails the admin mutation it records.
 */
const TAB = "AuditLog";

/**
 * Append one audit row to the "AuditLog" tab. Throws on any failure — every
 * caller wraps this in `after()` + try/catch and swallows the error, so an audit
 * outage (or a not-yet-created tab) can NEVER fail or roll back the admin
 * mutation being logged.
 *
 * The JWT + raw-fetch transport is DELIBERATELY DUPLICATED from
 * `appendOrderRow` in `@/lib/sheets` rather than refactored into a shared
 * helper: that function is order-critical (a buyer's order is lost if it
 * breaks), and audit logging must not share a code path with it. A future
 * extract-common-transport refactor is possible but intentionally deferred.
 *
 * Row layout (must match the owner's header order):
 *   [ ISO-8601 UTC timestamp, Actor, Action, Target, Summary ]
 *
 * `valueInputOption=RAW` (never USER_ENTERED) so no cell is ever evaluated as a
 * formula in the live Sheets view. `sanitizeCell` is applied to actor/target/
 * summary as defense-in-depth for CSV/XLSX export safety (a leading = + - @ or
 * control char re-arms on export). NONE of the 16 admin mutations that call this
 * ingest buyer text — every value is admin-authored — so sanitizing here is
 * purely defensive. The fixed `action` code is written verbatim (NOT sanitized).
 */
export async function appendAuditLog(e: AuditEntry): Promise<void> {
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

  // A freshly constructed Date → ISO-8601 UTC (Z). The Orders tab uses an
  // Asia/Manila wall-clock string; the audit tab is intentionally UTC ISO so
  // events sort unambiguously and are timezone-portable. Divergence is noted.
  const row = [
    new Date().toISOString(),
    sanitizeCell(e.actor),
    e.action, // fixed server-authored code — never sanitized
    sanitizeCell(e.target),
    sanitizeCell(e.summary),
  ];

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}` +
    `/values/${encodeURIComponent(TAB)}!A1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    throw new Error(`AuditLog append failed: ${res.status} ${await res.text()}`);
  }
}
