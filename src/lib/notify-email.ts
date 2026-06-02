import type { OrderRowInput } from "@/lib/sheets";
import { formatCentavos } from "@/lib/utils";
import { formatOrderItem, formatShippingLabel } from "@/lib/order-format";

/**
 * Owner order-notification email (Filipino-only ops artifact, mirrors sheets.ts).
 * Labels are hardcoded inline strings — NOT wired into the bilingual copy.ts
 * system (spec §2/§7). Shared item/shipping formatting comes from order-format.ts
 * so the email and the Sheet row can never drift (spec §4.3).
 */

/**
 * Subject-line sanitizer: strips CR/LF + ASCII control chars (header-injection
 * guard, spec §4.4.2). Single module-level definition — referenced by name.
 */
const SUBJECT_CTRL_RE = /[\r\n\x00-\x1f\x7f]/g;

/**
 * HTML-body-only escaper (spec §4.4.1). Private helper — tested via
 * buildOrderEmail's output. NEVER applied to the subject (plain-text MIME
 * header; entity-encoding it would render literal &lt; in the inbox).
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** One label/value row of the email table. `valueHtml` must already be escaped by the caller. */
function tableRow(label: string, valueHtml: string): string {
  return (
    `<tr>` +
    `<td style="padding:4px 12px 4px 0;font-weight:bold;vertical-align:top;white-space:nowrap">${label}</td>` +
    `<td style="padding:4px 0">${valueHtml}</td>` +
    `</tr>`
  );
}

/**
 * Build the owner notification email. Pure function — unit-testable.
 * `sheetId` controls the optional Google Sheet footer link; it defaults to
 * GOOGLE_SHEET_ID so callers can omit it, while tests pass it explicitly.
 */
export function buildOrderEmail(
  order: OrderRowInput,
  sheetId: string | undefined = process.env.GOOGLE_SHEET_ID
): { subject: string; html: string; text: string } {
  // Total = subtotal + shipping fee, with an EXPLICIT free guard (spec §4.3):
  // free:true adds 0 even if showFee is also (wrongly) true.
  const totalCentavos =
    order.subtotalCentavos +
    (order.shipping.free
      ? 0
      : order.shipping.showFee
        ? order.shipping.shippingCentavos
        : 0);
  const total = formatCentavos(totalCentavos);

  // Subject (plain-text MIME header — NOT HTML-escaped): strip control chars,
  // then truncate at 64 Unicode code points (spread = code-point iteration, so
  // the cut never lands mid-surrogate-pair). Spec §4.3/§4.4.2.
  const safeName = [...order.name.replace(SUBJECT_CTRL_RE, "")]
    .slice(0, 64)
    .join("");
  // "Bagong Order " + "NAG-" prefix are load-bearing for the owner's Gmail
  // retention filter (spec §4.3 warning) — never change without updating it.
  const subject = `Bagong Order ${order.orderNumber} — ${total} — ${safeName}`;

  // Shared formatting (order-format.ts) — keeps email and Sheet in sync.
  const shippingLabel = formatShippingLabel(order.shipping);
  const itemsHtml = order.items
    .map((item) => escapeHtml(formatOrderItem(item)))
    .join("<br>");
  const itemsText = order.items
    .map((item) => `- ${formatOrderItem(item)}`)
    .join("\n");

  const addressParts = [
    order.street,
    order.barangay,
    order.city,
    order.province,
    order.region,
  ];
  const addressHtml = addressParts.map(escapeHtml).join(", ");
  const addressText = addressParts.join(", ");

  // Minimal table, one <tr> per field, inline styles only (email clients strip
  // <head>/<style>). No external images, no branding (spec §4.3).
  const rows = [
    tableRow("Order #", order.orderNumber),
    tableRow("Petsa/Oras", order.timestampManila),
    tableRow("Pangalan", escapeHtml(order.name)),
    tableRow("Telepono", order.phone),
    tableRow("Address", addressHtml),
    tableRow("Landmark", escapeHtml(order.landmark)),
    tableRow("Mga Produkto", itemsHtml),
    tableRow("Subtotal", formatCentavos(order.subtotalCentavos)),
    tableRow("Shipping", shippingLabel),
    tableRow("Kabuuan (Total)", total),
    tableRow("Notes", escapeHtml(order.notes)),
  ].join("");

  // Footer link omitted entirely when the sheet id is unset/empty (spec §4.3).
  const sheetUrl = sheetId
    ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    : "";
  const sheetLinkHtml = sheetUrl
    ? `<p><a href="${sheetUrl}">Buksan ang Orders Sheet</a></p>`
    : "";

  const html =
    `<!DOCTYPE html><html><body>` +
    `<table style="max-width:600px;border-collapse:collapse">${rows}</table>` +
    sheetLinkHtml +
    `</body></html>`;

  // Plaintext alternative — same fields, plain rendering (deliverability, spec §4.1).
  const text = [
    `Order #: ${order.orderNumber}`,
    `Petsa/Oras: ${order.timestampManila}`,
    `Pangalan: ${order.name}`,
    `Telepono: ${order.phone}`,
    `Address: ${addressText}`,
    `Landmark: ${order.landmark}`,
    `Mga Produkto:`,
    itemsText,
    `Subtotal: ${formatCentavos(order.subtotalCentavos)}`,
    `Shipping: ${shippingLabel}`,
    `Kabuuan (Total): ${total}`,
    `Notes: ${order.notes}`,
    ...(sheetUrl ? [`Sheet: ${sheetUrl}`] : []),
  ].join("\n");

  return { subject, html, text };
}
