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

/** Resend API endpoint (spec §4.1 step 3). */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
/** Abort the Resend POST after this many ms (spec §4.1 step 3). */
const SEND_TIMEOUT_MS = 8000;
/** Max recipients parsed from ORDER_NOTIFY_EMAIL (spec §4.4.4 — forward-looking guard). */
const MAX_RECIPIENTS = 5;
/** Minimal shape check for ORDER_NOTIFY_EMAIL entries (spec §4.1 step 2). */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Build and POST the owner notification email to Resend.
 * Fire-and-forget: never throws to the caller; all failures are logged only.
 * `fetchImpl` is injectable for tests (same convention as verifyTurnstile).
 */
export async function sendNewOrderEmail(
  order: OrderRowInput,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  // ── Step 1 (spec §4.1): unset-config guard — BEFORE any parsing. Silent
  // no-op (no log): unset vars are the default on every deploy/test run, not a
  // misconfiguration. Warns are reserved for the set-but-invalid path below.
  const apiKey = process.env.RESEND_API_KEY;
  const recipientsRaw = process.env.ORDER_NOTIFY_EMAIL;
  if (!apiKey || !recipientsRaw) return;

  // ── Step 2 (spec §4.1): parse recipients — split on comma → trim → drop
  // zero-length → validate each → cap at MAX_RECIPIENTS.
  const entries = recipientsRaw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const valid: string[] = [];
  for (const entry of entries) {
    if (EMAIL_RE.test(entry)) {
      valid.push(entry);
    } else {
      console.warn("sendNewOrderEmail: skipping invalid recipient", entry);
    }
  }
  if (valid.length === 0) {
    console.warn(
      "sendNewOrderEmail: ORDER_NOTIFY_EMAIL had no valid recipients, skipping"
    );
    return;
  }
  const to = valid.slice(0, MAX_RECIPIENTS);

  const { subject, html, text } = buildOrderEmail(
    order,
    process.env.GOOGLE_SHEET_ID
  );

  // ── Step 3 (spec §4.1): POST to Resend with an 8s abort timeout. The signal
  // MUST be passed to fetch; the timer MUST be cleared on every exit path
  // (success, HTTP error, parse failure, abort, network error) via finally.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Noel AgriTV <onboarding@resend.dev>",
        to,
        subject,
        html,
        text,
      }),
      signal: controller.signal,
    });

    // ── Step 4 (spec §4.1): fetch does NOT throw on HTTP error status.
    if (response.ok) return;

    let parsed: { error?: { name?: string; message?: string } };
    try {
      parsed = (await response.json()) as {
        error?: { name?: string; message?: string };
      };
    } catch (e) {
      console.error("sendNewOrderEmail: failed to parse error response", e);
      return;
    }
    console.error(
      "sendNewOrderEmail:",
      response.status,
      parsed.error?.name,
      parsed.error?.message
    );
  } catch (e) {
    // controller.signal.aborted distinguishes OUR 8s timeout from a network
    // failure regardless of the thrown error's class (DOMException vs Error).
    if (controller.signal.aborted) {
      console.error("sendNewOrderEmail: timed out after 8s");
    } else {
      console.error("sendNewOrderEmail: fetch failed", e);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
