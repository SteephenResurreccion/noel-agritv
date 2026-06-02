import type { ShippingEstimate } from "@/lib/shipping";
import { formatCentavos } from "@/lib/utils";
// Intentionally static Filipino: ops artifacts (Sheet rows, owner email) are not
// buyer UI. Imported ONLY for copy.errors.shippingOnCall — no lang parameter,
// never getCopy(lang) (spec §4.3 formatting drift rule).
import { copy } from "@/lib/copy";

/**
 * Shared order-formatting primitives used by BOTH the Google Sheet row
 * (sheets.ts buildSheetRow) and the owner notification email
 * (notify-email.ts buildOrderEmail), so the two can never drift apart.
 *
 * Escaping is the CONSUMER's job: the email HTML-escapes each formatted line;
 * the Sheet stores raw strings (RAW valueInputOption).
 */

/** One order item as `name ×qty @₱unit` (Unicode × U+00D7 — matches the Sheet exactly). */
export function formatOrderItem(item: {
  name: string;
  qty: number;
  priceCentavos: number;
}): string {
  return `${item.name} ×${item.qty} @${formatCentavos(item.priceCentavos)}`;
}

/**
 * All items joined with "; " — the Sheet's single-cell layout.
 * (The email does NOT use this; it joins per-item lines with <br> so an item
 * name containing "; " can never break its line layout.)
 */
export function formatOrderItems(
  items: { name: string; qty: number; priceCentavos: number }[]
): string {
  return items.map(formatOrderItem).join("; ");
}

/**
 * Shipping display label — three-branch, branch order is load-bearing:
 * free:true → "FREE" wins regardless of showFee; then showFee → peso amount;
 * else the on-call ops copy. Do NOT collapse to two branches.
 */
export function formatShippingLabel(shipping: ShippingEstimate): string {
  return shipping.free
    ? "FREE"
    : shipping.showFee
      ? formatCentavos(shipping.shippingCentavos)
      : copy.errors.shippingOnCall;
}
