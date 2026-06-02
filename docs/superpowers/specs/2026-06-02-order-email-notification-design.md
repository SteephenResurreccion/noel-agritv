# Order Email Notification — Design Spec

**Date:** 2026-06-02
**Status:** Approved (multi-agent ultracode review: 5 research specialists + 3-model adversarial panel)
**Feature:** Email notification to the store owner when a new order is placed on the storefront.

---

## 1. Goal

When a buyer completes checkout, the store owner (Noel) receives an email with the order details — so he no longer has to poll the Google Sheet / admin dashboard to learn about new orders.

**Recipient:** Owner only (single inbox). Buyers do NOT receive email (no buyer email is collected; phone is the buyer identifier).
**Provider:** Resend (free tier), chosen for v1; provider kept swappable for production.
**Cost:** ₱0 — no new monthly line item.

## 2. Decisions and rationale

| Decision | Choice | Why |
|---|---|---|
| Recipient | Owner only, single inbox | Staff CC multiplies free-tier quota per recipient and is blocked by the no-domain constraint anyway |
| Provider | Resend | Only provider with a properly-authenticated zero-DNS sending path (`onboarding@resend.dev` → the Resend account owner's own inbox). Brevo (300/day free) reconsidered at production when a domain exists |
| Send mechanism | `after()` from `next/server` | Verified stable in Next 16.2.2; verified working on Vercel Hobby (Fluid Compute default-on, 300s post-response budget; project `vercel.json` does not disable it) |
| HTTP client | Plain `fetch`, no SDK | One POST endpoint; avoids a dependency; matches "no magic indirection" rule |
| Recipient config | `ORDER_NOTIFY_EMAIL` env var | Matches existing operational config pattern (Sheets, Turnstile). Admin-configurable UI = YAGNI for v1 |
| Email language | Filipino (ops artifact) | Same convention as Sheet rows (`sheets.ts` header comment); inline strings in the module, NOT imported from storefront `copy.ts` |

## 3. Constraint that shaped the rollout

**The client has no domain yet** (noelagritv.com is a future purchase). Resend's test sender `onboarding@resend.dev` can deliver **only to the email address that owns the Resend account** — any other recipient is hard-rejected (403 `validation_error`). Verified against Resend docs 2026-06-02.

Therefore:

- **v1 (now):** The Resend account MUST be created using the exact email address that should receive order notifications (Noel's inbox). Sender = `onboarding@resend.dev`, recipient = that one inbox. Zero DNS setup.
- **Production (when domain is purchased):** Verify a sending subdomain (`send.noelagritv.com`) with SPF + DKIM TXT records → switch from-address → rotate to a domain-scoped sending-only API key → optionally re-evaluate Brevo (300/day free) vs Resend (100/day free) against real spike data → optionally add staff recipients.

## 4. Architecture

### 4.1 New module: `src/lib/notify-email.ts`

Exports:

- `buildOrderEmail(order: OrderRowInput): { subject: string; html: string }` — pure function, unit-testable.
- `sendNewOrderEmail(order: OrderRowInput): Promise<void>` — builds the email and POSTs it to Resend.

Behavior of `sendNewOrderEmail`:

1. Read `RESEND_API_KEY` and `ORDER_NOTIFY_EMAIL` from `process.env`.
   - If either is unset → `console.warn("sendNewOrderEmail: not configured, skipping")` and **return** (no-op). Follow the `turnstile.ts` posture, NOT the `sheets.ts` throw posture. Local dev and fresh deploys must stay silent.
2. Parse `ORDER_NOTIFY_EMAIL`: split on comma, trim, drop empties, validate each with a simple email regex, **cap at 5 recipients**. Invalid entries → `console.warn` and skip. Zero valid recipients → warn and return.
3. POST `https://api.resend.com/emails` with:
   - Headers: `Authorization: Bearer <key>`, `Content-Type: application/json`
   - Body: `{ from: "Noel AgriTV <onboarding@resend.dev>", to: [...], subject, html }`
   - `AbortController` timeout: **8 seconds**. On abort, log `"sendNewOrderEmail: timed out after 8s"` and return.
4. Error handling — `fetch` does NOT throw on HTTP error status:
   - Check `response.ok` AND parse the JSON body for Resend's structured `{ error: { name, message } }`.
   - On failure log: `console.error("sendNewOrderEmail:", response.status, errorName, errorMessage)`.
   - Never throw out of this function in a way that could reach the caller unhandled — but the caller also wraps it (defense in depth).

### 4.2 Integration: `src/app/(storefront)/checkout/actions.ts`

- Extract the order object literal currently inlined at lines 118–133 into a named const:
  `const orderInput: OrderRowInput = { orderNumber, timestampManila, name: data.name, ... }`
- Pass the same `orderInput` to both `buildSheetRow(orderInput)` and the email.
- After `await appendOrderRow(row)` succeeds (line 134), before `return { ok: true, orderNumber }`:

```ts
import { after } from "next/server";

after(async () => {
  try {
    await sendNewOrderEmail(orderInput);
  } catch (e) {
    console.error("sendNewOrderEmail: failed", e);
  }
});
```

Rules:
- The try/catch goes **inside** the `after()` callback. `after()` registers synchronously and never throws; an outer try/catch protects nothing.
- The email is dispatched ONLY after a successful Sheets append. Sheets failure → no email (the order failed).
- An email failure can never fail the order: the response has already been sent when the callback runs.
- Do NOT use a bare un-awaited promise (work outside `after()`/`waitUntil` is dropped when the lambda is reclaimed — verified against Vercel docs).

### 4.3 Email content

**Subject:** `Bagong Order <orderNumber> — <total> — <buyer name>`
e.g. `Bagong Order NAG-20260602-A7K1 — ₱1,250 — Juan Dela Cruz`

- **Total** = `subtotalCentavos + (shipping.showFee && !shipping.free ? shipping.shippingCentavos : 0)`, formatted with the existing `formatCentavos` (`src/lib/utils.ts`). Never show subtotal alone as if it were the total.
- Buyer name in the subject: strip `\r`, `\n`, and ASCII control chars; clamp to 64 chars.

**HTML body** (simple table, Filipino labels, ops-facing):

| Field | Source |
|---|---|
| Order # | `orderNumber` |
| Petsa/Oras | `timestampManila` |
| Pangalan | `name` (escaped) |
| Telepono | `phone` |
| Address | `street`, `barangay`, `city`, `province`, `region` (each escaped) |
| Landmark | `landmark` (escaped) |
| Mga Order | items as `name ×qty @₱unit` per line (names escaped) — same format as `buildSheetRow` |
| Subtotal | `formatCentavos(subtotalCentavos)` |
| Shipping | FREE / fee / "Confirmed on call" — same logic as `buildSheetRow` |
| **Kabuuan (Total)** | computed total |
| Notes | `notes` (escaped) |

Plus a link to the Google Sheet (convenience only — the body is self-sufficient; note in setup docs the link needs the owner's Google login).

**Formatting drift rule:** the item-line and shipping formatting logic must be SHARED with `buildSheetRow` (factor a small shared formatter in `sheets.ts` or a shared module) so the email and the Sheet row can never diverge.

### 4.4 Security requirements (from adversarial review — mandatory)

1. **HTML escaping:** ship a local `escapeHtml()` in `notify-email.ts` (no repo util exists) replacing `& < > " '` with entities. Apply to EVERY buyer-controlled field before interpolation into HTML: name, province, city, barangay, street, landmark, notes, item names. No buyer field appears in HTML unescaped.
2. **Header injection guard:** subject-line name is stripped of CR/LF/control chars (`/[\r\n\x00-\x1f\x7f]/g`) and length-clamped.
3. **API key scope:** `RESEND_API_KEY` must be a **Sending-access** key (not full-access). It cannot be domain-restricted until a domain is verified; rotate to a domain-scoped key immediately after DNS verification at production.
4. **Recipient cap:** max 5 recipients parsed from the env var (prevents quota blowout / PII fan-out from a fat-fingered env var).
5. **No client-side involvement:** the send runs server-side inside `after()`. Never move it client-side (would leak the API key). No CSP changes are needed or wanted.

## 5. RA 10173 requirements (ship in the same change — blocking)

1. **Amend the checkout privacy notice** in `src/lib/copy.ts` — both languages (FIL ~line 226–227, EN ~line 687–688). The current text says data is used *"solely to process and deliver your order"* and names no third parties. New text must:
   - Remove "solely".
   - Disclose that order details may be transmitted to third-party service providers (including email and delivery providers that may operate outside the Philippines).
   - Suggested EN: *"By placing this order you agree that Noel AgriTV will use your name, phone number, and address to process and deliver your order, and may transmit these details to third-party service providers (including email and delivery providers that may operate outside the Philippines), per the Data Privacy Act of 2012 (RA 10173)."* Mirror in Filipino.
   - Layout-check both languages at 390px after the copy change (Filipino runs ~40% longer).
2. **Processor register:** record Resend as a personal information processor. Resend's DPA auto-applies via ToS acceptance (resend.com/legal/dpa — includes SCCs); no signature needed. The client's NPC documentation must list Resend alongside Google (Sheets) and Cloudflare (Turnstile).
3. **Ops requirements for the owner (documented in setup guide, not code):**
   - Enable 2-step verification on the notification inbox.
   - Create a Gmail filter/auto-purge routine for `Bagong Order NAG-` emails so the inbox copy of buyer PII respects the project's 5-year retention/anonymization policy.

## 6. Configuration & docs

`.env.example` gets a new numbered provisioning block (modeled on the existing Google Sheets / Turnstile blocks):

```
# --- Order email notification (Resend) ---
# 1. Create a free Resend account at https://resend.com USING THE EMAIL THAT SHOULD
#    RECEIVE ORDER NOTIFICATIONS (the test sender can only deliver to that address
#    until a domain is verified).
# 2. Create an API key with "Sending access" permission only.
# 3. Set both vars below. If either is unset, the feature silently no-ops (orders unaffected).
# NOTE: free tier = 100 emails/day; each recipient counts separately. Keep ONE recipient in v1.
RESEND_API_KEY=
ORDER_NOTIFY_EMAIL=
```

## 7. Cut from v1 (YAGNI — do not build)

- Staff CC / multi-recipient support (env var technically accepts a list but docs mandate one recipient)
- Admin-configurable recipient page (AdminConfig + form)
- Resend Node SDK
- CSP `connect-src` changes
- Digest/batch emails
- Customer-facing confirmation email
- `unstable_after` fallbacks or `experimental.after` config (not needed in Next 16.2.2)

## 8. Testing

**Unit (pure `buildOrderEmail`):**
- Escaping: name with `<script>`, quotes, `&`; notes with `<img onerror=...>`; CRLF in name (subject must be clean); emoji/ñ/Filipino characters preserved readable.
- Money: total with shipping fee; FREE shipping (total = subtotal); on-call shipping (total = subtotal, label "Confirmed on call").

**Mocked-fetch (`sendNewOrderEmail`):**
- 200 success → resolves silently.
- 403 / 429 with `{error}` body → logs status + error name/message, never throws to caller.
- Timeout (mock hung fetch) → aborts at 8s, logs timeout message.
- Unset `RESEND_API_KEY` / `ORDER_NOTIFY_EMAIL` → warn + no-op, fetch never called.
- Invalid recipient entries → skipped with warn; zero valid → no-op.

**Manual smoke:** one real order on a deploy with the env vars set → email arrives in the Resend account owner's inbox; Vercel logs show no errors. (Resend test addresses `delivered@resend.dev` etc. are also available but still subject to the to-address restriction pre-domain.)

## 9. Verified platform facts (research appendix)

All verified 2026-06-02 by research agents against official sources:

- Next.js **16.2.2** (pinned); `after()` is **stable**, imported from `next/server`, no config flag needed.
- Vercel Hobby + Fluid Compute (default-on; project's `vercel.json` = `{"regions":["sin1"]}` does not disable it): `after()` works, 300s post-response budget. Active-CPU quota counts CPU time only, not I/O wait — the email fetch is negligible.
- Resend free tier: **100 emails/day**, 3,000/month, 1 domain, 5 req/s. Each To/CC/BCC recipient counts separately. Over-cap sends are rejected (not queued).
- `onboarding@resend.dev`: testing-only; delivers ONLY to the Resend account owner's email (403 otherwise).
- Resend first paid tier: $20/mo, 50k emails/month, no daily cap.
- Brevo free tier: **300/day**, forever, no card — the production-time alternative if spike days exceed Resend's cap.
- SendGrid free tier discontinued (2025); Postmark free = 100/month (too small); SES = 12-month trial + sandbox friction; Gmail-via-service-account impossible without paid Google Workspace.

## 10. Open items for production (not blocking v1)

| Item | Trigger |
|---|---|
| Buy domain + verify `send.noelagritv.com` on Resend (SPF/DKIM) | Client purchases domain |
| Rotate to domain-scoped sending key | After domain verification |
| Re-evaluate Resend vs Brevo (300/day) | Real spike-day data exists |
| Staff recipients | After domain verification + client request |
| Admin-configurable recipient UI | Client asks to change recipient without redeploy |
