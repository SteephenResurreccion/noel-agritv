import { JWT } from "google-auth-library";
import type { ShippingEstimate } from "@/lib/shipping";
import { formatCentavos } from "@/lib/utils";
import { copy } from "@/lib/copy";

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

/** Build the single sheet row in the EXACT spec §7 column order. */
export function buildSheetRow(o: OrderRowInput): string[] {
  const itemsStr = o.items
    .map((i) => `${i.name} ×${i.qty} @${formatCentavos(i.priceCentavos)}`)
    .join("; ");
  const shippingStr = o.shipping.free
    ? "FREE"
    : o.shipping.showFee
      ? formatCentavos(o.shipping.shippingCentavos)
      : copy.errors.shippingOnCall;
  return [
    o.orderNumber, // Order#
    o.timestampManila, // Timestamp (Asia/Manila)
    o.name, // Name
    o.phone, // Phone
    o.region, // Region
    o.province, // Province
    o.city, // City/Municipality
    o.barangay, // Barangay
    o.street, // Street
    o.landmark, // Landmark
    itemsStr, // Items (name ×qty @₱unit)
    formatCentavos(o.subtotalCentavos), // Subtotal
    shippingStr, // Shipping (est.)
    o.notes, // Notes
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
