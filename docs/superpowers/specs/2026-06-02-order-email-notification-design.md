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
| Provider | Resend | Only provider with a properly-authenticated zero-DNS sending path: `onboarding@resend.dev` delivers to the Resend account owner's own inbox with zero DNS. **Brevo has no equivalent zero-DNS sandbox sender — it requires a verified sender/domain before sending to anyone, so it cannot deliver in v1's no-domain state at all** (verify this Brevo fact before build; it is the single premise this provider choice turns on). Once a domain exists, Brevo's 300/day beats Resend's 100/day — re-evaluated then (see §9, §10) |
| Send mechanism | `after()` from `next/server` | Stable since Next 15.1.0; project pinned to 16.2.2. Verified working on Vercel Hobby (Fluid Compute default-on, 300s post-response budget; project `vercel.json` does not disable it) |
| HTTP client | Plain `fetch`, no SDK | One POST endpoint; avoids a dependency; matches "no magic indirection" rule |
| Recipient config | `ORDER_NOTIFY_EMAIL` env var | Matches existing operational config pattern (Sheets, Turnstile). Admin-configurable UI = YAGNI for v1 |
| Email language | Filipino (ops artifact) | Same convention as Sheet rows (`sheets.ts` header comment). Labels are **hardcoded inline Filipino strings** in the module — no `lang` injection, no import of the bilingual storefront `copy.ts` strings. The one allowed exception is the shared shipping-label helper reusing `copy.errors.shippingOnCall` (a static ops-facing string, already used by `buildSheetRow`) — see §4.3 |

## 3. Constraint that shaped the rollout

**The client has no domain yet** (noelagritv.com is a future purchase). Resend's test sender `onboarding@resend.dev` can deliver **only to the email address that owns the Resend account** — any other recipient is hard-rejected (403 `validation_error`). Verified against Resend docs 2026-06-02.

Therefore:

- **v1 (now):** The Resend account MUST be created using the exact email address that should receive order notifications (Noel's inbox). Sender = `onboarding@resend.dev`, recipient = that one inbox. Zero DNS setup.
- **Production (when domain is purchased):** Verify a sending subdomain (`send.noelagritv.com`) with SPF + DKIM TXT records → switch the from-address to that subdomain → rotate to a domain-scoped sending-only API key → optionally re-evaluate Brevo (300/day free) vs Resend (100/day free) → optionally add staff recipients → optionally add an admin-configurable recipient UI. §10 is the authoritative production checklist; this is its narrative summary.

The Brevo re-evaluation trigger is **real spike-day data showing Resend's 100/day cap is exceeded** (independent of the domain step) — stated identically in §9 and §10.

## 4. Architecture

### 4.1 New module: `src/lib/notify-email.ts`

Exports:

- `buildOrderEmail(order: OrderRowInput, sheetId?: string): { subject: string; html: string; text: string }` — pure function, unit-testable. `sheetId` defaults to `process.env.GOOGLE_SHEET_ID` and controls the optional Google Sheet footer link (see §4.3); passing it explicitly keeps the builder pure and lets tests cover the link-present/link-absent branches without env stubbing. `text` is the plaintext alternative part (same fields, plain rendering) included alongside `html` in the Resend POST for deliverability.
- `sendNewOrderEmail(order: OrderRowInput, fetchImpl: typeof fetch = fetch): Promise<void>` — builds the email and POSTs it to Resend. `fetchImpl` is injectable for tests, matching the `verifyTurnstile(token, fetchImpl = fetch)` convention in `turnstile.ts`.

Behavior of `sendNewOrderEmail`:

1. Read `RESEND_API_KEY` and `ORDER_NOTIFY_EMAIL` from `process.env`. **Check for unset vars FIRST, before any parsing:** if `RESEND_API_KEY` is falsy OR `ORDER_NOTIFY_EMAIL` is falsy (empty string or `undefined`), **return immediately with no log and skip step 2 entirely.**
   - This short-circuit is load-bearing for the §8 test assertions: `ORDER_NOTIFY_EMAIL` *unset* (silent no-op, no warn) is observably distinct from `ORDER_NOTIFY_EMAIL` *set-but-all-invalid* (step 2's "no valid recipients" warn). Only the step-1-before-step-2 order keeps those two cases distinct.
   - The posture borrowed from `turnstile.ts` is only "do not throw"; `turnstile.ts` itself returns `false` without logging (`turnstile.ts:11`), so do NOT model a warn on it. `submitOrder` runs on every order and on every deploy/test without these vars (the default), so an unset-config warn would fire on every order and pollute the existing `__tests__/app/checkout-actions.test.ts`. Reserve logging for *misconfiguration* (key set but config invalid), per step 2.
2. Parse `ORDER_NOTIFY_EMAIL` in this order: **split on comma → trim each → drop zero-length strings → validate each remaining entry** with the regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Invalid entries → `console.warn("sendNewOrderEmail: skipping invalid recipient", entry)` and skip. **Cap the valid list at 5 recipients** (see §4.4.4 for why the cap is a forward-looking guard, not a v1 capability). Zero valid recipients → `console.warn("sendNewOrderEmail: ORDER_NOTIFY_EMAIL had no valid recipients, skipping")` and return (distinct message from the unset case so §8 can assert on it).
3. POST `https://api.resend.com/emails` with:
   - Headers: `Authorization: Bearer <key>`, `Content-Type: application/json`
   - Body: `{ from: "Noel AgriTV <onboarding@resend.dev>", to: [...], subject, html, text }` — include a `text` plaintext part (plain rendering of the same fields) alongside `html`; HTML-only mail scores worse on spam filters.
   - `signal: controller.signal` — **MUST be passed in the `fetch` options object** alongside the headers and body. Without it the `AbortController` never aborts the in-flight request: the timer fires but the fetch hangs, the timeout test hangs, and no timeout log is emitted.
   - `AbortController` timeout: **8 seconds**. On abort, `console.error("sendNewOrderEmail: timed out after 8s")` (error level — a timeout is a failed delivery, like step 4) and return. **Clear the timer with a `try { … } finally { clearTimeout(timeoutId) }` that wraps the entire fetch call and response handling**, so the timer is cleared on EVERY exit path — including the step-4 json-parse-failure catch — and a settled request leaves no dangling timer (avoids a vitest open-handle warning). Clearing it only in the success/error branches would leak the timer when the json parse throws.
4. Error handling — `fetch` does NOT throw on HTTP error status:
   - On **success** (`response.ok`): return silently (optionally read `{ id }` from the body; no log required).
   - On failure: check `response.ok` is false, then **guard the JSON parse** (`await response.json()` can throw on an empty/non-JSON body — wrap it in try/catch; on parse failure log `console.error("sendNewOrderEmail: failed to parse error response", e)` and return). When the body parses, read Resend's structured `{ error: { name, message } }` and log `console.error("sendNewOrderEmail:", response.status, errorName, errorMessage)`.
   - Never throw out of this function in a way that could reach the caller unhandled — but the caller also wraps it (defense in depth).

### 4.2 Integration: `src/app/(storefront)/checkout/actions.ts`

- The fields are currently passed as an inline object literal to the `buildSheetRow({ ... })` call (the argument object, not yet a named variable). Extract that literal **verbatim** into a named const:
  `const orderInput: OrderRowInput = { orderNumber, timestampManila, name: data.name, ... }`
- **Preserve the existing null-coalescing** from the current inline literal: `landmark: data.landmark ?? ""` and `notes: data.notes ?? ""`. These two fields use `.optional().default("")` in the checkout schema (`order.ts:69-70`), so the parsed values are already non-null `string` — the `?? ""` in the current `actions.ts` (lines 128, 132) is a redundant no-op. Copy the literal **verbatim anyway**: the goal is a pure cut-and-paste extraction, not a refactor. Do not "simplify" by removing it.
- **Declare `orderInput` immediately after the `normalizedPhone` null-guard** (after the `if (!normalizedPhone) return …` check, before the `try` block) so it is in scope at the post-success `after()` call site AND so TypeScript has already narrowed `normalizedPhone` from `string | null` to `string` at that point. Declaring it higher (above the null-guard) makes `phone: normalizedPhone` a `string | null`, which is a type error against `OrderRowInput.phone: string`. Inside the `try`, build `const row = buildSheetRow(orderInput)` then `await appendOrderRow(row)`. Pass the same `orderInput` to both `buildSheetRow(orderInput)` and the email.
- Anchor the edit by **code structure, not line numbers** (line numbers drift): the `try { … }` wraps `buildSheetRow(...)` + `appendOrderRow(...)`, the `catch` returns the error result, and `return { ok: true, orderNumber }` sits after the `catch` on the success path. Place the `after()` registration **between the close of the `try/catch` and the success `return`** — so it only runs when the Sheets append succeeded:

```ts
import { after } from "next/server";

// ... orderInput declared AFTER the `if (!normalizedPhone) return …` guard
//     and BEFORE the try block (so normalizedPhone is narrowed to `string`,
//     and orderInput is in scope at the after() call site below) ...

try {
  const row = buildSheetRow(orderInput);
  await appendOrderRow(row);
} catch (e) {
  console.error("submitOrder: sheets append failed", e);
  return { ok: false, error: "sheets", message: copy.errors.submitFailed };
}

// after() sits between the catch close and the success return — runs ONLY
// when the Sheets append succeeded (the error path returned above).
after(async () => {
  try {
    await sendNewOrderEmail(orderInput);
  } catch (e) {
    console.error("sendNewOrderEmail: failed", e);
  }
});

return { ok: true, orderNumber };
```

Rules:
- The try/catch goes **inside** the `after()` callback. `after()` registers synchronously and never throws; an outer try/catch protects nothing.
- The email is dispatched ONLY after a successful Sheets append. Sheets failure → no email (the order failed).
- An email failure can never fail the order: the response has already been sent when the callback runs.
- Do NOT use a bare un-awaited promise (work outside `after()`/`waitUntil` is dropped when the lambda is reclaimed — verified against Vercel docs).

### 4.3 Email content

**Subject:** `Bagong Order <orderNumber> — <total> — <buyer name>`
e.g. `Bagong Order NAG-20260602-A7K1 — ₱1,250 — Juan Dela Cruz` (free/disabled shipping, so total = subtotal = ₱1,250). With a ₱150 shipping fee the same order's subject would be `Bagong Order NAG-20260602-A7K1 — ₱1,400 — Juan Dela Cruz` — the subject always shows the **computed total** the owner will collect, never the subtotal alone.

- The delimiter is a **literal em dash `—` (U+2014)** surrounded by spaces — do NOT substitute an ASCII hyphen.
- The `<total>` shown in the subject is the **computed total below** (not the subtotal): `formatCentavos(total)`. This is the amount the owner will collect, correct for free-shipping and on-call orders too.
- **Total** = `subtotalCentavos + (shipping.free ? 0 : shipping.showFee ? shipping.shippingCentavos : 0)`, formatted with the existing `formatCentavos` (`src/lib/utils.ts`). Never show subtotal alone as if it were the total. The `free` branch is explicit so a `free:true` estimate adds 0 regardless of `showFee` — do NOT rely on `showFee:true` implying `free:false`. The `ShippingEstimate` type in `shipping.ts` does NOT enforce mutual exclusivity (both `showFee` and `free` are independent `boolean`s); the formula is correct for every value `resolveShipping()` produces, and the explicit `free` guard keeps it correct even if that invariant is ever violated. If `ShippingEstimate` is later refactored to a discriminated union, revisit this formula.
- Buyer name in the subject: strip CR/LF and ASCII control chars with the regex `/[\r\n\x00-\x1f\x7f]/g` (the same guard as §4.4.2 — DRY, one regex), then **truncate via `[...name].slice(0, 64).join("")` (hard cut, no ellipsis)**. The spread iterates by Unicode code point rather than UTF-16 code unit, so the cut never lands mid-character. Precomposed Latin diacritics (ñ, é) are single code units either way and were never at risk; the spread only matters for surrogate-pair characters such as emoji in a name. Names ≤64 code points are used as-is after cleaning. Do NOT run the subject through `escapeHtml()` — the subject is a plain-text MIME header field, and entity-encoding it would render literal `&lt;` etc. in the inbox subject line (see §4.4.1).
- ⚠ The subject's literal prefix `Bagong Order ` (including the trailing space) and the order-number `NAG-` prefix are **load-bearing for the Gmail retention filter** (§5 item 3 "Ops requirements", the Gmail filter/auto-purge bullet) — the filter matches `Bagong Order NAG-`. Changing either silently breaks PII auto-purge (an RA 10173 failure) — update the Gmail filter in lockstep if you ever change them.

**HTML body** — a **minimal `<table>`, one `<tr>` per field**, no `<style>` block (email clients strip `<head>`/`<style>`); use only inline `style=` attributes if any styling is applied at all (unstyled is acceptable). Wrap in a `<!DOCTYPE html><html><body>…</body></html>` shell, `max-width:600px` on the table. No external images, no Resend/brand logo, no footer branding. Labels are inline literal strings in the module (NOT imported from `copy.ts`). Use these **exact** labels:

| Label (exact) | Source |
|---|---|
| `Order #` | `orderNumber` |
| `Petsa/Oras` | `timestampManila` |
| `Pangalan` | `name` (escaped) |
| `Telepono` | `phone` |
| `Address` | `street`, `barangay`, `city`, `province`, `region` (each escaped; one cell, comma-joined) |
| `Landmark` | `landmark` (escaped) |
| `Mga Produkto` | items, as `name ×qty @₱unit`. **Map `items` through the shared `formatOrderItem` helper (`order-format.ts`), wrap each result as `escapeHtml(formatOrderItem(item))`, and join with `<br>`** so each item renders on its own line in a single cell. Do NOT call `formatOrderItems(items)` and split its `"; "`-joined output: an item name containing `"; "` would break on the wrong delimiter. `formatOrderItems` (the `"; "`-joined variant) is used by `buildSheetRow` only; `notify-email.ts` shares the per-item primitive `formatOrderItem` and builds the `<br>` layout itself. Every line escaped before HTML interpolation. (Label is plural Filipino `Mga Produkto` — "Orders" was a transcription error; the cell holds products, not orders) |
| `Subtotal` | `formatCentavos(subtotalCentavos)` |
| `Shipping` | `formatShippingLabel(shipping)` from `order-format.ts` — three-branch, copied verbatim from `buildSheetRow` (`sheets.ts` lines 30–34): `shipping.free ? "FREE" : shipping.showFee ? formatCentavos(shipping.shippingCentavos) : copy.errors.shippingOnCall`. The on-call branch renders `copy.errors.shippingOnCall` = `"Confirmed on call"` — the `copyFil.errors.shippingOnCall` value (the `copy` export aliases `copyFil`; the `errors` bundle value is `"Confirmed on call"`, identical in EN). Do NOT collapse to a two-branch `showFee ? fee : onCall`; the `free:true → "FREE"` branch is load-bearing and must come first. See the Formatting drift rule below for the exact import |
| `Kabuuan (Total)` | computed total |
| `Notes` | `notes` (escaped) |

The item line uses the **Unicode multiplication sign `×` (U+00D7)**, matching `buildSheetRow` exactly (not ASCII `x`).

**Google Sheet link** (convenience only — the body is self-sufficient; needs the owner's Google login, note in setup docs): append a footer `<a href="https://docs.google.com/spreadsheets/d/${sheetId}/edit">` (reuses the existing `GOOGLE_SHEET_ID` env var; the gid/Orders-tab anchor is omitted, no deep-link to the new row). **If the sheet id is unset/empty, omit the link entirely** (do not emit a broken anchor).

This is the one env read inside the otherwise-pure builder. To keep `buildOrderEmail` unit-testable without env stubbing, give it an **optional `sheetId?: string` parameter** that defaults to `process.env.GOOGLE_SHEET_ID` (`buildOrderEmail(order: OrderRowInput, sheetId?: string)`); `sendNewOrderEmail` passes `process.env.GOOGLE_SHEET_ID` explicitly. Tests then cover both branches directly (sheetId present → link in HTML; sheetId absent → no link) with no env coupling. (If the implementer instead reads `process.env.GOOGLE_SHEET_ID` inline, the §8 unit tests MUST `vi.stubEnv("GOOGLE_SHEET_ID", …)` for both branches — the parameter form is preferred.)

**Formatting drift rule (refactor dependency — lands BEFORE or WITH `notify-email.ts`, never after):** the item-line and shipping formatting logic must be SHARED with `buildSheetRow`. Factor it into a **new module `src/lib/order-format.ts`**, imported by BOTH `sheets.ts` (`buildSheetRow`) and `notify-email.ts`, so the email and the Sheet row can never diverge. Expected exports (exact signatures):

- `formatOrderItem(item: { name: string; qty: number; priceCentavos: number }): string` — ONE item as `` `${name} ×${qty} @${formatCentavos(priceCentavos)}` `` (Unicode `×` U+00D7). This is the single-item shared primitive: the **email maps `items` through it and joins with `<br>`**; the **Sheet maps through it and joins with `"; "`**. Sharing at the per-item level — rather than sharing the joined string — lets the two consumers use different separators while the item format itself can never drift. Escaping stays in the consumer, NOT in `formatOrderItem`: the email wraps each line as `escapeHtml(formatOrderItem(item))` (escaping the whole line is equivalent to escaping just the name — `×`, `@`, `₱`, digits and spaces are all HTML-inert, and the name is the only buyer-controlled part). This equivalence holds only as long as `formatOrderItem`'s non-name fields stay HTML-inert; if the helper's template is ever extended to include additional buyer-supplied data (e.g. a variant label), switch to escaping each buyer field before passing it to `formatOrderItem`. The Sheet does not escape (RAW cell).
- `formatOrderItems(items: { name: string; qty: number; priceCentavos: number }[]): string` — maps `items` through `formatOrderItem` and joins with `"; "`. This is the literal logic currently inline in `buildSheetRow` (`sheets.ts` lines 27–29); `buildSheetRow` must be updated to call it. (The email does NOT call `formatOrderItems` — it uses `formatOrderItem` per-item with a `<br>` join — so an item name containing `"; "` can never break its line layout.)
- `formatShippingLabel(shipping: ShippingEstimate): string` — returns `shipping.free ? "FREE" : shipping.showFee ? formatCentavos(shipping.shippingCentavos) : copy.errors.shippingOnCall` (branch order verbatim from `buildSheetRow` lines 30–34). `buildSheetRow` must be updated to call it.

`order-format.ts` must `import { copy } from "@/lib/copy"` (the default `copyFil` export — the **same import `sheets.ts` already uses**) for `copy.errors.shippingOnCall` ONLY. It takes **no `lang` parameter** and never calls `getCopy(lang)`: the email is a Filipino-only ops artifact, and `copy.errors.shippingOnCall` is the static ops-facing value (`"Confirmed on call"`, identical in both bundles). Do NOT re-literalize the on-call string in either consumer — reuse the helper so the email and Sheet stay in sync if that copy string ever changes. All OTHER strings in `notify-email.ts` (the inline labels in the table above) remain hardcoded literals; only the shared item/shipping formatting goes through `order-format.ts`. The §8 integration tests must verify the email and Sheet row use the **same `order-format.ts` helpers** (import-identity, not duplicated logic).

### 4.4 Security requirements (from adversarial review — mandatory)

1. **HTML escaping:** ship a local `escapeHtml(s: string): string` in `notify-email.ts` (no repo util exists) replacing `& < > " '` with their HTML entities (escape `&` first) — a **private module helper, not exported** (tested via `buildOrderEmail`'s output, no standalone test). Empty and whitespace-only strings are returned unchanged; the function never returns `null`/`undefined`. Buyer fields are non-null by the order schema, so no null-guard is required. Apply to EVERY buyer-controlled field before interpolation into HTML: name, province, city, barangay, street, landmark, notes, item names. No buyer field appears in HTML unescaped. **`escapeHtml()` is HTML-body ONLY** — it must NOT be applied to the subject line. The subject is a plain-text MIME header field; entity-encoding it would render literal `&lt;`/`&amp;` in the inbox. The subject name uses the §4.4.2 control-char strip + truncate only.
2. **Header injection guard:** subject-line name is stripped of CR/LF/control chars with the regex `/[\r\n\x00-\x1f\x7f]/g` and length-clamped via the §4.3 grapheme-aware truncate. Define this regex **once** as a module-level `const SUBJECT_CTRL_RE = /[\r\n\x00-\x1f\x7f]/g` in `notify-email.ts` (mirroring the "private module helper" treatment of `escapeHtml`) and reference it by name where the subject name is sanitized — do NOT write the literal in two places (two identical inline literals are not DRY). The subject is only assembled inside `buildOrderEmail`, so there is a single call site.
3. **API key scope:** `RESEND_API_KEY` must be a **Sending-access** key (not full-access). It cannot be domain-restricted until a domain is verified; rotate to a domain-scoped key immediately after DNS verification at production.
4. **Recipient cap:** max 5 recipients parsed from the env var (prevents quota blowout / PII fan-out from a fat-fingered env var). **In v1 only the single account-owner inbox is actually deliverable** (per §3, `onboarding@resend.dev` 403-rejects any other recipient) — the cap-at-5 parser is a **forward-looking safety guard for the post-domain phase** (§10 "Staff recipients"), NOT a v1 capability. If more than one recipient is configured in v1, the extras are 403-rejected by Resend and logged on the error path. The comma-split / validate / cap-at-5 parser IS required in v1 as this safety rail; it is not the "multi-recipient support" cut in §7.
5. **No client-side involvement:** the send runs server-side inside `after()`. Never move it client-side (would leak the API key). No CSP changes are needed or wanted.

## 5. RA 10173 requirements (ship in the same change — blocking)

1. **Amend the checkout privacy notice** in `src/lib/copy.ts` — both languages. Anchor by **key, not line number** (line numbers drift): the `checkout.privacyNotice` string under the FIL bundle (`copyFil`) and the `checkout.privacyNotice` string under the EN bundle (`copyEn`) — two edits, one per bundle. These are the ONLY two occurrences of "solely"/"para lamang" in the codebase (verified) — no other privacy copy needs touching. The current text says data is used *"solely to process and deliver your order"* and names no third parties. New text must:
   - Remove "solely" (EN). In the FIL string the equivalent word is **`lamang`** in the phrase `"para lamang iproseso at ihatid"` — remove `lamang`.
   - Disclose that order details may be transmitted to third-party service providers (including email and delivery providers that may operate outside the Philippines).
   - **EN (use verbatim):** *"By placing this order you agree that Noel AgriTV will use your name, phone number, and address to process and deliver your order, and may transmit these details to third-party service providers (including email and delivery providers that may operate outside the Philippines), per the Data Privacy Act of 2012 (RA 10173)."*
   - **FIL (use verbatim):** *"Sa pag-order, sumasang-ayon kang gagamitin ng Noel AgriTV ang iyong pangalan, numero ng telepono, at address para iproseso at ihatid ang iyong order, at maaaring ipasa ang mga detalyeng ito sa mga third-party service provider (kabilang ang email at delivery providers na maaaring nasa labas ng Pilipinas), ayon sa Data Privacy Act of 2012 (RA 10173)."*
   - Layout-check both languages at 390px after the copy change (Filipino runs ~40% longer).
2. **Processor register:** record Resend as a personal information processor. Resend's DPA auto-applies via ToS acceptance (resend.com/legal/dpa — includes SCCs); no signature needed. The client's NPC documentation must list Resend alongside Google (Sheets) and Cloudflare (Turnstile).
3. **Ops requirements for the owner — document as a numbered checklist in the `.env.example` provisioning block (§6), as comment lines under the Resend block (no separate doc file — `docs/setup-guide.md` is YAGNI for v1; `.env.example` already serves provisioning for Sheets and Turnstile):**
   - Enable 2-step verification on the notification inbox.
   - Create a Gmail filter/auto-purge routine for `Bagong Order NAG-` emails so the inbox copy of buyer PII respects the project's 5-year retention/anonymization policy.
   - **After setting OR rotating `RESEND_API_KEY`, place one test order** with `ORDER_NOTIFY_EMAIL` set to the Resend account owner's email, then confirm success: in the Vercel Function logs, NO `console.error` from `sendNewOrderEmail` appears, AND the email arrives in the owner's inbox within ~10s. The send is fire-and-forget inside `after()`, so a bad/miscopied/rotated key surfaces ONLY here (a console error in the logs), never to the buyer. If no email arrives after 2 min, check the logs for a parse-failure message (malformed key) or HTTP 403 (invalid recipient) / 429 (rate limit). A dedicated health endpoint is YAGNI; this checklist line is the cheap mitigation.
   - **Set the Orders tab as the Sheet's first/primary tab** so the email footer link (which omits the gid anchor — see §4.3) lands on Orders rather than whatever tab was last viewed.

**Ship ordering:** this RA 10173 copy change MUST be deployed before (or with) the email feature. Land both in the **same PR**; if the email feature ships as a follow-up, the privacy-notice change must already be live.

## 6. Configuration & docs

`.env.example` gets a new numbered provisioning block (modeled on the existing Google Sheets block, which uses numbered steps — the Turnstile block uses a different test-key-note format). **Append it as the last block in the file**, after the Turnstile block:

```
# --- Order email notification (Resend) ---
# 1. Create a free Resend account at https://resend.com USING THE EMAIL THAT SHOULD
#    RECEIVE ORDER NOTIFICATIONS (the test sender can only deliver to that address
#    until a domain is verified).
# 2. Create an API key with "Sending access" permission only.
# 3. Set both vars below. If either is unset, the feature silently no-ops (orders unaffected).
# NOTE: free tier = 100 emails/day. Whether each recipient counts separately toward the
#       daily quota is unconfirmed by Resend's docs — keep ONE recipient in v1 as a
#       conservative default (the no-domain test sender already forces one anyway).
#
# OWNER OPS CHECKLIST (RA 10173 + key-rotation — §5 item 3):
# a. Enable 2-step verification on the notification inbox.
# b. Create a Gmail filter/auto-purge routine for "Bagong Order NAG-" emails so the
#    inbox copy of buyer PII respects the 5-year retention/anonymization policy.
# c. After setting OR rotating RESEND_API_KEY, place one test order with ORDER_NOTIFY_EMAIL
#    set to the Resend account owner's email, then confirm in the Vercel Function logs that
#    NO console.error from sendNewOrderEmail appears, and that the email arrives in the
#    owner's inbox within ~10s. The send is fire-and-forget inside after(), so a
#    bad/miscopied/rotated key surfaces ONLY here (a log error), never to the buyer. If no
#    email arrives after 2 min, check the logs for a parse-failure message (malformed key)
#    or HTTP 403 (invalid recipient) / 429 (rate limit). A dedicated health endpoint is YAGNI.
# d. Set the Orders tab as the Sheet's first/primary tab so the email footer link (which
#    omits the gid anchor — see §4.3) lands on Orders rather than the last-viewed tab.
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ORDER_NOTIFY_EMAIL=owner@example.com
```

## 7. Cut from v1 (YAGNI — do not build)

- Staff CC / multi-recipient support — technically blocked in v1 by the no-domain Resend constraint (§3), and YAGNI even after a domain exists until the client requests it (§10). (Distinct from the cap-at-5 *parser*, which IS built in v1 as a safety rail — see §4.4.4.)
- English/bilingual email variant, or wiring the email builder into the `copy.ts`/i18n system — the email is a Filipino-only ops artifact (mirrors `sheets.ts`); do NOT add a language toggle or `lang` param.
- Admin-configurable recipient page (AdminConfig + form)
- Resend Node SDK
- CSP `connect-src` changes — N/A, not a deferred feature: the send is a server-side `fetch`, so the browser `connect-src` directive never applies (see §4.4.5).
- Digest/batch emails
- Customer-facing confirmation email
- `unstable_after` fallbacks or `experimental.after` config (not needed in Next 16.2.2)

## 8. Testing

**Harness & location:** put the new file at **`__tests__/lib/notify-email.test.ts`** — the vitest `include` glob is `["__tests__/**/*.test.{ts,tsx}"]`, so tests under `src/` are silently skipped. For env vars, use `vi.stubEnv` (as in `__tests__/lib/sheets.test.ts`) **or** direct `process.env` assignment with cleanup in `afterEach` (as in `__tests__/lib/turnstile.test.ts`, which sets `process.env.TURNSTILE_SECRET_KEY` in `beforeEach` and `delete`s it in `afterEach` — it does NOT use `vi.stubEnv`); either is fine. Inject the mock fetch via the `fetchImpl` parameter (the `sendNewOrderEmail(order, fetchImpl)` signature) rather than `vi.stubGlobal`. No coverage threshold required for v1.

**Unit (pure `buildOrderEmail`):**
- Escaping: name with `<script>`, quotes, `&`; notes with `<img onerror=...>`; CRLF in name (subject must be clean — no literal `&lt;`, the subject is NOT HTML-escaped per §4.4.1); emoji/ñ/Filipino characters preserved readable.
- Subject delimiter — **two cases, not one optional-decimal regex**: assert the subject contains the **literal em dash `—` (U+2014)** between the order number, total, and name (verify it is NOT corrupted to an ASCII hyphen or stripped). (1) **Whole-peso total** (e.g. subtotal ₱1,250 + ₱0 shipping = ₱1,250) → assert `/NAG-\S+ — ₱[\d,]+ — /` (no decimal group), confirming `formatCentavos` emits no `.00` for a round total. (2) **Fractional total** (covered by the non-round money case below) → assert `/NAG-\S+ — ₱[\d,]+\.\d{2} — /` (decimal **required**), confirming the `.50` is present and the regex reaches the trailing ` — `. A single `(\.\d{2})?` regex is too permissive — it would pass even if the decimal were wrongly dropped from a fractional total. The `Bagong Order ` prefix and `NAG-` are the Gmail-filter trigger (§4.3), so this is load-bearing.
- Money — non-round total: a case where subtotal+shipping fee sums to a fractional peso amount (e.g. `₱1,250.50`). Assert the `.50` survives in BOTH the subject and the HTML total cell, and the em dash delimiter is intact (this is the case that exposes the regex bug above).
- Money: total with shipping fee (`free:false, showFee:true` → subtotal + fee); **FREE shipping (`free:true` → total = subtotal, Shipping cell = `"FREE"`)**; on-call shipping (`free:false, showFee:false` → total = subtotal, Shipping cell = `copy.errors.shippingOnCall`). Assert the on-call cell against **`copy.errors.shippingOnCall`** (imported from `@/lib/copy`), not a hardcoded literal, so the expectation can never drift from the copy bundle. (Its current value is `"Confirmed on call"`.) The Shipping cell value is the output of `formatShippingLabel` (from `order-format.ts`): the **unit test verifies the value**, the **integration test verifies import-identity** (that `notify-email.ts` imports the shared helper rather than re-implementing the three-branch logic). If a cold implementer duplicates the branch logic in `notify-email.ts`, the unit tests still pass but the integration import-identity check fails — that failure is intentional.
- Google Sheet link: `sheetId` passed (or `GOOGLE_SHEET_ID` stubbed) → link present in HTML; `sheetId` absent/empty → no `<a href=…docs.google.com…>` in the HTML (the omit-on-unset branch).

**Mocked-fetch (`sendNewOrderEmail`):**
- 200 success → resolves silently.
- 403 / 429 with `{error}` body → logs status + error name/message, never throws to caller.
- Non-JSON / empty error body → guarded, logs parse-failure message, never throws.
- Timeout (mock hung fetch) → aborts at 8s, logs the timeout message at `console.error`.
- Step-1 dual guard — TWO distinct cases (the early return triggers if EITHER var is unset): (a) `RESEND_API_KEY` unset (`ORDER_NOTIFY_EMAIL` may be set or absent) → silent no-op, **no warn**, fetch never called; (b) `ORDER_NOTIFY_EMAIL` unset (`RESEND_API_KEY` set) → silent no-op, **no warn**, fetch never called. Neither emits a log (the unset-config path is deliberately silent; warns are reserved for the misconfig path below).
- Invalid recipient entries (both vars set, but addresses malformed) → skipped with warn; zero valid → distinct "no valid recipients" warn + no-op (this IS a warn, unlike the unset cases).
- `ORDER_NOTIFY_EMAIL` set to `", ,"` (commas/spaces only — a truthy value that survives the step-1 unset check but yields zero entries after split→trim→drop-zero-length) → distinct "no valid recipients" warn + no-op, fetch never called. Closes the gap between the unset case (step 1, silent) and the genuinely-invalid case (step 2, warn); this is a real copy-paste risk in the Vercel env UI.
- **>5 valid recipients → truncated to 5** (asserts the §4.4.4 cap). Make `fetchImpl` a `vi.fn()` that resolves a 200; assert `JSON.parse(mockFetch.mock.calls[0][1].body).to` has length 5, regardless of how many valid addresses are in `ORDER_NOTIFY_EMAIL`. This test exercises the parser cap only — it does NOT model Resend's runtime 403 for non-owner recipients (the §4.4.4 v1 reality, separately covered by the 403 error-path test).

**Integration (`actions.ts` — highest-risk edit, touches the live order path):** add the `after()`/email assertions to the **existing `__tests__/app/checkout-actions.test.ts`** — do NOT stand up a fresh integration file. That file already has the full mock set `submitOrder` needs (`next/headers` cookies/headers stubs, `@/lib/turnstile` → true, `@/lib/admin-store` → `getAdminConfig`, `@/lib/sheets` → `appendOrderRow` spy); a new file would have to duplicate all of them and would throw inside `getLangFromRequest()` (the first line of `submitOrder`, which reads `cookies()`/`headers()` from `next/headers`) long before reaching `after()`. This is the project's FIRST `after()` usage (no existing precedent to copy), so the `next/server` mock is mandatory and specified here. The real `after()` (`node_modules/next/dist/esm/server/after/after.js`) does `const workStore = workAsyncStorage.getStore(); if (!workStore) throw … E468 ("`after` was called outside a request scope")`. Under vitest/jsdom there is **no Next request context**, so the unmocked `after()` THROWS the moment `submitOrder` calls it. Add to that existing file (alongside its current mocks) a `next/server` mock that **invokes and awaits** the callback, plus a `@/lib/notify-email` mock so the email send is a spy:

```ts
vi.mock("next/server", () => ({
  // MUST await the callback: the registered callback is `async () => { … }`,
  // so a synchronous `cb()` only starts the promise — assertions would race
  // ahead of `sendNewOrderEmail`. Awaiting `cb()` settles it before the mock
  // (and thus `await submitOrder(...)`) returns.
  after: vi.fn(async (cb: () => void | Promise<void>) => { await cb(); }),
}));

// REQUIRED so assertion (b) has a spy target. Without this mock the real
// sendNewOrderEmail runs (a silent no-op under unset env vars) and cannot be
// asserted on.
vi.mock("@/lib/notify-email", () => ({
  sendNewOrderEmail: vi.fn().mockResolvedValue(undefined),
}));
```

Because the `next/server` mock awaits `cb()`, `await submitOrder(...)` settles the async callback (which calls `sendNewOrderEmail`) before assertions run. Import the `sendNewOrderEmail` spy from `@/lib/notify-email` and assert (a) `after` is called exactly once per successful order, (b) the `sendNewOrderEmail` spy is called inside the callback with the SAME `orderInput` object passed to `buildSheetRow` (assert object identity/deep-equality against the row's source input), and (c) a thrown email error — make the spy `mockRejectedValueOnce(new Error(...))` for this case — is swallowed by the callback's try/catch and does NOT change the action result (`{ ok: true }`).

⚠ **The existing `__tests__/app/checkout-actions.test.ts` MUST add this `next/server` mock — and is also where the new `after()`/email assertions above live.** It currently mocks only `next/headers` (plus turnstile, admin-store, and sheets) and calls `submitOrder` directly; the moment §4.2's edit adds `after(async () => …)` to `submitOrder`, the real `after()` throws E468, that error propagates out of `submitOrder`, and the existing `expect(result).toMatchObject({ ok: true })` goes red. The breakage source is `after()` throwing outside a request scope — **NOT** the unset env vars. (The unset-config no-op only governs whether `sendNewOrderEmail` does any work; it does nothing to stop `after()` itself from throwing.) Without the `next/server` mock the suite is red. **Add the mock in the SAME commit as §4.2's code change, not as a follow-up** — the existing file passes today only because it never reaches an `after()` call; the instant that call lands, this file is red until the mock is present. Because the `after()`/email assertions are added to this same file, the `@/lib/notify-email` mock is required here (it is the spy target for assertion (b)).

**Note on the §4.4.3 key-scope requirement:** "Sending-access key, not full-access" is a provisioning/ops checklist item verified at setup time, **not unit-testable** — accounted for here so it is not silently absent from the test plan.

**Manual smoke:** one real order on a deploy with the env vars set → email arrives in the Resend account owner's inbox; Vercel logs show no errors. (Resend test addresses `delivered@resend.dev` etc. are also available but still subject to the to-address restriction pre-domain.)

## 9. Verified platform facts (research appendix)

All verified 2026-06-02 by research agents against official sources:

- Next.js **16.2.2** (pinned); `after()` has been **stable since Next.js 15.1.0**, imported from `next/server`, no config flag needed.
- Vercel Hobby + Fluid Compute (default-on; project's `vercel.json` = `{"regions":["sin1"]}` does not disable it): `after()` works, 300s post-response budget. Active-CPU quota counts CPU time only, not I/O wait — the email fetch is negligible.
- Resend free tier: **100 emails/day**, 3,000/month, 1 domain, 5 req/s. Over-cap sends are rejected (not queued). (Whether each To/CC/BCC recipient counts separately toward the daily quota is **unconfirmed** — Resend's docs only state "both sent and received emails count towards these quotas." Treated as a conservative assumption, not a verified fact; the v1 single-recipient decision stands on the no-domain restriction regardless.)
- `onboarding@resend.dev`: testing-only; delivers ONLY to the Resend account owner's email (403 otherwise).
- Resend first paid tier: $20/mo, 50k emails/month, no daily cap.
- Brevo free tier: **300/day**, forever, no card — the production-time alternative. Re-evaluation trigger (canonical, same as §2/§3/§10): **real spike-day data shows Resend's 100/day cap is exceeded** (independent of the domain step).
- SendGrid free tier discontinued (2025); Postmark free = 100/month (too small); SES = 12-month trial + sandbox friction; Gmail-via-service-account impossible without paid Google Workspace.

## 10. Open items for production (not blocking v1)

This table is the authoritative production checklist; §3's production paragraph is its narrative summary.

| Item | Trigger |
|---|---|
| Buy domain + verify `send.noelagritv.com` on Resend (SPF/DKIM) | Client purchases domain |
| Switch the from-address to `…@send.noelagritv.com` | After domain verification |
| Rotate to domain-scoped sending key | After domain verification |
| Re-evaluate Resend vs Brevo (300/day) | Real spike-day data shows Resend's 100/day cap is exceeded |
| Staff recipients | After domain verification + client request |
| Admin-configurable recipient UI | Client asks to change recipient without redeploy |
