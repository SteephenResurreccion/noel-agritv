import { z } from "zod";

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

/** Form schema: `lookupOrder` re-validates against this server-side. */
export const lookupSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^NAG-\d{8}-[A-Z0-9]{4}$/, "Order number format is NAG-YYYYMMDD-XXXX"),
  phoneLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter the last 4 digits of your phone"),
});

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
      error: "validation" | "not_found" | "sheets" | "rate_limited";
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
 * Header-row tolerance: if row 0 is a header (`row[0] === "Order#"`) we just
 * skip it — the regex would never match `"Order#"` against `"NAG-..."` anyway,
 * but explicit handling protects against future header changes.
 *
 * Phone match: digits-only on the sheet side, then `endsWith` the buyer's
 * last-4. Tolerates accidental spaces/dashes if staff manually edits the row.
 */
export function findOrderInRows(
  rows: string[][],
  orderNumber: string,
  phoneLast4: string
): string[] | null {
  if (rows.length === 0) return null;
  const start = rows[0]?.[COL.orderNumber] === "Order#" ? 1 : 0;
  for (let i = start; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= COL.phone) continue;
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
