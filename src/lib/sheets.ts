import { JWT } from "google-auth-library";
import type { ShippingEstimate } from "@/lib/shipping";
import { formatCentavos } from "@/lib/utils";
import { formatOrderItems, formatShippingLabel } from "@/lib/order-format";

export interface OrderRowInput {
  orderNumber: string;
  /** ISO-ish Asia/Manila timestamp string */
  timestampManila: string;
  name: string;
  phone: string; // normalized +639...
  region: string; // human label
  province: string;
  city: string;
  barangay: string;
  street: string;
  landmark: string;
  items: { name: string; qty: number; priceCentavos: number }[];
  subtotalCentavos: number;
  shipping: ShippingEstimate;
  notes: string;
}

/**
 * Neutralize a buyer-controlled TEXT cell against spreadsheet formula/CSV
 * injection. valueInputOption=RAW stops Google Sheets evaluating the cell in the
 * live web view, but the dangerous-prefix characters survive verbatim and re-arm
 * the moment the owner exports to CSV/XLSX and reopens in Excel/LibreOffice.
 * OWASP-standard defense: if the value's first character is a formula trigger
 * (= + - @) or a leading control char (tab / CR / LF), prepend a single
 * apostrophe so importers treat the whole cell as text. The apostrophe is
 * display-invisible in Excel and Sheets, so the owner's view is unchanged.
 * Apply ONLY to buyer-controlled cells — server-generated columns (order#,
 * timestamp, formatted money, fixed strings) can never start with a trigger.
 */
export function sanitizeCell(value: string): string {
  return /^[=+\-@\t\r\n]/.test(value) ? `'${value}` : value;
}

/** Build the single sheet row in the EXACT spec §7 column order. */
export function buildSheetRow(o: OrderRowInput): string[] {
  const itemsStr = formatOrderItems(o.items);
  const shippingStr = formatShippingLabel(o.shipping);
  return [
    o.orderNumber, // Order#
    o.timestampManila, // Timestamp (Asia/Manila)
    sanitizeCell(o.name), // Name (buyer-controlled)
    o.phone, // Phone (normalized +639…, server-validated)
    o.region, // Region (allowlisted against PH_REGIONS server-side)
    sanitizeCell(o.province), // Province (buyer-controlled)
    sanitizeCell(o.city), // City/Municipality (buyer-controlled)
    sanitizeCell(o.barangay), // Barangay (buyer-controlled)
    sanitizeCell(o.street), // Street (buyer-controlled free-text)
    sanitizeCell(o.landmark), // Landmark (buyer-controlled free-text)
    itemsStr, // Items (name ×qty @₱unit)
    formatCentavos(o.subtotalCentavos), // Subtotal
    shippingStr, // Shipping (est.)
    sanitizeCell(o.notes), // Notes (buyer-controlled free-text)
    "NEW", // Status
    "", // J&T Tracking#
    "", // Staff notes
  ];
}

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const TAB = "Orders";

/**
 * Append one row to the "Orders" tab. Throws on any failure (caller catches → Messenger fallback).
 * Auth: service-account JWT via google-auth-library; append via Sheets REST API.
 * Reads GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY.
 */
export async function appendOrderRow(row: string[]): Promise<void> {
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
    // RAW (not USER_ENTERED): store every cell as a literal string so a
    // buyer-supplied value beginning with = + - @ is never evaluated as a
    // formula when staff open the sheet (CSV/formula injection → PII exfil).
    // All 17 columns are display strings; none relied on USER_ENTERED coercion,
    // and RAW also keeps the "+639…" phone as text instead of a number.
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
    throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`);
  }
}
