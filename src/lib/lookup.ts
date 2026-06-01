import { z } from "zod";
import { copy, type Copy } from "@/lib/copy";

/**
 * Canonical order-number shape: `NAG-YYYYMMDD-XXXXXX` where the suffix is 4–6
 * base-36 uppercase chars (`[A-Z0-9]`). New orders are 6 chars (CSPRNG, see
 * `generateOrderNumber` in `@/lib/order`); legacy orders already issued in the
 * Sheet are 4 chars and MUST stay lookup-able, hence the `{4,6}` range. This is
 * the single source of truth for "is this cell a real order #?" — used both to
 * validate buyer input and to guard the sheet-parse boundary.
 */
export const ORDER_NUMBER_RE = /^NAG-\d{8}-[A-Z0-9]{4,6}$/;

/**
 * True when `value` is a syntactically valid order number. Any sheet row whose
 * column A fails this is not an order (header row, blank row, junk) and must be
 * skipped by every reader — see `findOrderInRows`.
 */
export function isOrderNumber(value: string | undefined): boolean {
  return typeof value === "string" && ORDER_NUMBER_RE.test(value);
}

/**
 * Buyer self-service order lookup.
 *
 * The buyer types their order # (NAG-YYYYMMDD-XXXX) and the last 4 digits of
 * the phone they used at checkout. The server reads the Orders sheet via the
 * service-account JWT and looks for a row where column A matches the order #
 * AND the digits in column D end with the buyer's last-4. Match → return a
 * privacy-sanitized summary (status + items + shipping + tracking #).
 *
 * Privacy choice: do NOT return the full name, full phone, full address, or
 * notes. The buyer already knows their own address; echoing it back wastes
 * privacy headroom for zero UX gain.
 */

/**
 * Build the lookup form schema for a given copy bundle so its validation
 * messages localize. `lookupSchema` below is the Filipino-default instance kept
 * for back-compat (existing imports + tests); the `lookupOrder` server action
 * rebuilds it via `makeLookupSchema(getCopy(lang))` so a buyer gets validation
 * errors in their chosen language.
 */
export function makeLookupSchema(c: Copy) {
  return z.object({
    orderNumber: z
      .string()
      .trim()
      .regex(ORDER_NUMBER_RE, c.errors.orderFormat),
    phoneLast4: z
      .string()
      .trim()
      .regex(/^\d{4}$/, c.errors.last4),
    /**
     * Cloudflare Turnstile token, mirroring `checkoutSchema` in `@/lib/order`.
     * `lookupOrder` verifies it server-side via `verifyTurnstile` BEFORE any
     * sheet read, raising the bot cost of order enumeration. Invisible widget,
     * so a real buyer never sees it. Required and non-empty — an empty/absent
     * token fails verification anyway, but rejecting it at the schema avoids a
     * pointless siteverify round-trip.
     */
    turnstileToken: z.string().min(1, c.common.antiSpam),
  });
}

/** Form schema: `lookupOrder` re-validates against this server-side (FIL default). */
export const lookupSchema = makeLookupSchema(copy);

export type LookupInput = z.infer<typeof lookupSchema>;

export interface LookupSummary {
  /** The order # the buyer entered. */
  orderNumber: string;
  /** Raw status from the sheet — display as-is (NEW / Confirmed / Booked / ...). */
  status: string;
  /** Raw Items column from the sheet (e.g. "Bio Plant Booster ×1 @₱575"). */
  itemsLine: string;
  /** Raw Subtotal column — already ₱-formatted. */
  subtotal: string;
  /** Raw Shipping column — may be "Confirmed on call". */
  shipping: string;
  /** J&T waybill #. Empty string when staff haven't booked yet. */
  trackingNumber: string;
}

export type LookupResult =
  | { ok: true; summary: LookupSummary }
  | {
      ok: false;
      error: "validation" | "turnstile" | "not_found" | "sheets" | "rate_limited";
      message: string;
    };

/** Column indices, mirroring spec §7 + `buildSheetRow`. */
const COL = {
  orderNumber: 0,
  // timestamp: 1,
  // name: 2,
  phone: 3,
  // region..notes: 4..13
  items: 10,
  subtotal: 11,
  shipping: 12,
  status: 14,
  tracking: 15,
} as const;

/**
 * Scan the rows for an order # + phone tail match. Pure function — takes the
 * sheet payload as input, returns the matching row (or null). The READ helper
 * supplies the rows; the server action orchestrates.
 *
 * Parse-boundary guard: any row whose column A is not a valid order number
 * (`isOrderNumber`) is skipped — this covers a human-friendly header row, blank
 * rows, and junk uniformly, so no non-order row is ever parsed as an order.
 * This is THE place the guard lives; every reader through this function (the
 * `/lookup` page today, any future "list all orders" view) inherits it.
 *
 * Phone match: digits-only on the sheet side, then `endsWith` the buyer's
 * last-4. Tolerates accidental spaces/dashes if staff manually edits the row.
 */
export function findOrderInRows(
  rows: string[][],
  orderNumber: string,
  phoneLast4: string
): string[] | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= COL.phone) continue;
    if (!isOrderNumber(row[COL.orderNumber])) continue;
    if (row[COL.orderNumber] !== orderNumber) continue;
    const digits = (row[COL.phone] ?? "").replace(/\D/g, "");
    if (digits.endsWith(phoneLast4)) return row;
  }
  return null;
}

/**
 * Extract only the buyer-visible columns. Privacy gate — name / phone /
 * address / notes never leave the server.
 */
export function summarizeRow(row: string[]): LookupSummary {
  return {
    orderNumber: row[COL.orderNumber] ?? "",
    status: row[COL.status] ?? "",
    itemsLine: row[COL.items] ?? "",
    subtotal: row[COL.subtotal] ?? "",
    shipping: row[COL.shipping] ?? "",
    trackingNumber: row[COL.tracking] ?? "",
  };
}
