# Order Email Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a buyer completes checkout, the store owner receives a Filipino-language email with the order details, sent via Resend inside Next.js `after()` — fire-and-forget, never able to fail the order.

**Architecture:** A new pure builder + sender module (`src/lib/notify-email.ts`) shares item/shipping formatting with the Google Sheet row via a new `src/lib/order-format.ts` (so email and Sheet can never drift). The checkout server action registers the send inside `after()` only after a successful Sheets append. The RA 10173 privacy notice in `copy.ts` is amended in the same PR.

**Tech Stack:** Next.js 16.2.2 (App Router, `after()` from `next/server`), TypeScript, plain `fetch` (no SDK), Resend HTTP API, Vitest 4 + jsdom.

**Binding spec:** `docs/superpowers/specs/2026-06-02-order-email-notification-design.md` — every requirement in it is locked and user-approved. Where this plan and the spec disagree, **the spec wins**. Do not relitigate: Resend, owner-only recipient, env-var config, `after()`, no-domain v1 rollout.

---

## Context for the implementer (you have zero prior context)

- **Repo root:** `C:\Users\steephenresu\Desktop\AutoDev\noel-agritv`, branch `feat/order-email-notification` (already checked out, clean tree).
- **Test harness:** Vitest 4, jsdom, config in `vitest.config.ts`. Include glob is `__tests__/**/*.test.{ts,tsx}` — tests placed under `src/` are silently skipped. Run with `npm test` (= `vitest run`). Lint with `npm run lint` (= `eslint`, flat config in `eslint.config.mjs`).
- **Path alias:** `@/*` → `src/*`.
- **The email is a Filipino-only ops artifact** (like the Google Sheet rows). Labels are hardcoded inline Filipino strings — do NOT wire it into the bilingual `copy.ts` system. The single exception: `copy.errors.shippingOnCall` is reused through the shared `formatShippingLabel` helper.
- **Unicode characters are load-bearing.** The subject delimiter is a literal em dash `—` (U+2014). The item-quantity sign is `×` (U+00D7). Do not substitute ASCII `-` or `x`. The `Bagong Order ` prefix and `NAG-` order-number prefix are matched by the owner's Gmail auto-purge filter — changing them breaks RA 10173 PII retention.
- **Commit convention:** conventional commits with scope (recent history: `feat(header): …`, `docs(spec): …`). Every commit ends with the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/order-format.ts` | **Create** | Shared item/shipping formatting primitives used by BOTH the Sheet row and the email |
| `src/lib/sheets.ts` | Modify | `buildSheetRow` delegates its inline formatting to `order-format.ts` (pure refactor, no behavior change) |
| `src/lib/copy.ts` | Modify | RA 10173 privacy notice — third-party disclosure, both language bundles |
| `src/lib/notify-email.ts` | **Create** | `buildOrderEmail` (pure builder) + `sendNewOrderEmail` (Resend POST) + private `escapeHtml` / `SUBJECT_CTRL_RE` |
| `src/app/(storefront)/checkout/actions.ts` | Modify | Extract `orderInput` const; register `after()` email send on the success path |
| `.env.example` | Modify | Resend provisioning block (verbatim from spec §6), appended last |
| `__tests__/lib/notify-email.test.ts` | **Create** | Unit tests (builder), mocked-fetch tests (sender), import-identity guard |
| `__tests__/app/checkout-actions.test.ts` | Modify | `next/server` + `@/lib/notify-email` mocks; integration assertions (a)/(b)/(c) |

Files NOT to create (spec §7 YAGNI): no `__tests__/lib/order-format.test.ts` (covered via `sheets.test.ts` + `notify-email.test.ts`), no admin UI, no SDK, no docs/setup-guide.md, no CSP changes.

---

### Task 1: Baseline verification

**Files:** none modified.

- [ ] **Step 1: Confirm clean state and green baseline**

```bash
git status
npm test
npm run lint
```

Expected: working tree clean on `feat/order-email-notification`; all existing tests pass; lint clean. If the baseline is red, STOP and report — do not build on a broken baseline.

---

### Task 2: `src/lib/order-format.ts` — shared formatters + `sheets.ts` refactor

The spec's formatting-drift rule (§4.3): item-line and shipping formatting must be shared between the Sheet row and the email. This task extracts the logic currently inline in `buildSheetRow` (`src/lib/sheets.ts:27-34`) into a new module, **verbatim** — a pure refactor. The existing `__tests__/lib/sheets.test.ts` is the regression net: it asserts exact cell values (`"Bio Plant Booster ×2 @₱250; Bio Enzyme ×1 @₱150"`, `"FREE"`, `"Confirmed on call"`) and must stay green untouched.

**Files:**
- Create: `src/lib/order-format.ts`
- Modify: `src/lib/sheets.ts`
- Regression net (do NOT modify): `__tests__/lib/sheets.test.ts`

- [ ] **Step 1: Create `src/lib/order-format.ts`**

```ts
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
```

- [ ] **Step 2: Refactor `src/lib/sheets.ts` to use the shared helpers**

Three edits:

(2a) Replace the import block at the top (lines 1–5). The `copy` import moves to `order-format.ts`; `formatCentavos` stays (still used for the Subtotal column):

```ts
// OLD (lines 1-5):
import { JWT } from "google-auth-library";
import type { ShippingEstimate } from "@/lib/shipping";
import { formatCentavos } from "@/lib/utils";
// Intentionally static Filipino: sheet rows are an ops-facing artifact, not buyer UI (bilingual rewire skipped on purpose).
import { copy } from "@/lib/copy";

// NEW:
import { JWT } from "google-auth-library";
import type { ShippingEstimate } from "@/lib/shipping";
import { formatCentavos } from "@/lib/utils";
import { formatOrderItems, formatShippingLabel } from "@/lib/order-format";
```

(2b) Replace the inline formatting in `buildSheetRow` (currently lines 27–34):

```ts
// OLD:
  const itemsStr = o.items
    .map((i) => `${i.name} ×${i.qty} @${formatCentavos(i.priceCentavos)}`)
    .join("; ");
  const shippingStr = o.shipping.free
    ? "FREE"
    : o.shipping.showFee
      ? formatCentavos(o.shipping.shippingCentavos)
      : copy.errors.shippingOnCall;

// NEW:
  const itemsStr = formatOrderItems(o.items);
  const shippingStr = formatShippingLabel(o.shipping);
```

(2c) Everything else in `sheets.ts` (the `OrderRowInput` interface, the returned array, `appendOrderRow`) stays byte-identical.

- [ ] **Step 3: Run the regression net**

```bash
npx vitest run __tests__/lib/sheets.test.ts
```

Expected: PASS — all 4 tests (`produces 17 columns in spec order`, `writes 'Confirmed on call'…`, `writes FREE…`, `appends with valueInputOption=RAW…`). These prove the refactor preserved behavior exactly.

- [ ] **Step 4: Run the full suite + lint**

```bash
npm test
npm run lint
```

Expected: all green. Lint must not flag an unused `copy` or `formatCentavos` import in `sheets.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/order-format.ts src/lib/sheets.ts
git commit -m "refactor(sheets): extract shared order formatters into order-format.ts

Spec 2026-06-02 §4.3 formatting-drift rule: the upcoming order email must
share item/shipping formatting with buildSheetRow so they can never diverge.
Pure extraction — existing sheets.test.ts assertions unchanged and green.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: RA 10173 privacy notice — `src/lib/copy.ts` (both bundles)

Spec §5 item 1 (blocking, ships in the same PR). Anchor by **key**, not line number: the `checkout.privacyNotice` string in the FIL bundle (`copyFil`, currently near line 226) and in the EN bundle (`copyEn`, currently near line 687). These are the only two occurrences of "solely"/"para lamang" in the codebase. No test asserts on the current text (verified), so no test changes are needed.

**Files:**
- Modify: `src/lib/copy.ts` (two string edits)

- [ ] **Step 1: Replace the FIL privacy notice (in `copyFil` → `checkout` → `privacyNotice`)**

```ts
// OLD:
    privacyNotice:
      "Sa pag-order, sumasang-ayon kang gagamitin ng Noel AgriTV ang iyong pangalan, numero ng telepono, at address para lamang iproseso at ihatid ang iyong order, ayon sa Data Privacy Act of 2012 (RA 10173).",

// NEW (verbatim from spec §5 — do not reword):
    privacyNotice:
      "Sa pag-order, sumasang-ayon kang gagamitin ng Noel AgriTV ang iyong pangalan, numero ng telepono, at address para iproseso at ihatid ang iyong order, at maaaring ipasa ang mga detalyeng ito sa mga third-party service provider (kabilang ang email at delivery providers na maaaring nasa labas ng Pilipinas), ayon sa Data Privacy Act of 2012 (RA 10173).",
```

- [ ] **Step 2: Replace the EN privacy notice (in `copyEn` → `checkout` → `privacyNotice`)**

```ts
// OLD:
    privacyNotice:
      "By placing this order you agree that Noel AgriTV will use your name, phone number, and address solely to process and deliver your order, per the Data Privacy Act of 2012 (RA 10173).",

// NEW (verbatim from spec §5 — do not reword):
    privacyNotice:
      "By placing this order you agree that Noel AgriTV will use your name, phone number, and address to process and deliver your order, and may transmit these details to third-party service providers (including email and delivery providers that may operate outside the Philippines), per the Data Privacy Act of 2012 (RA 10173).",
```

- [ ] **Step 3: Verify no "solely"/"lamang" leftovers and run the suite**

```bash
# Should return ONLY hits inside docs/ (the spec itself), none in src/:
git grep -n "para lamang\|solely" -- src/
npm test
npm run lint
```

Expected: no matches in `src/`; suite green; lint clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/copy.ts
git commit -m "feat(checkout): RA 10173 third-party disclosure in privacy notice (FIL+EN)

Spec 2026-06-02 §5: order details may be transmitted to third-party service
providers (email/delivery, possibly outside PH). Removes 'lamang'/'solely'.
Required to ship with (or before) the order email notification feature.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Note: the 390px FIL/EN layout verification for this copy change happens in Task 8 (needs the dev server).

---

### Task 4: `buildOrderEmail` — pure builder (TDD)

**Files:**
- Create: `__tests__/lib/notify-email.test.ts` (builder tests only in this task)
- Create: `src/lib/notify-email.ts` (builder only in this task — `sendNewOrderEmail` comes in Task 5)

- [ ] **Step 1: Write the failing builder tests**

Create `__tests__/lib/notify-email.test.ts` with exactly this content:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";

// Spy-wrap the shared order-format module (real implementations preserved) so
// the import-identity tests (added in a later task) can assert BOTH consumers
// route through it. Harmless for the value-assertion tests below.
vi.mock("@/lib/order-format", { spy: true });

import { buildOrderEmail } from "@/lib/notify-email";
import type { OrderRowInput } from "@/lib/sheets";
import { copy } from "@/lib/copy";

const base: OrderRowInput = {
  orderNumber: "NAG-20260602-A7K1",
  timestampManila: "2026-06-02 14:30:00",
  name: "Juan Dela Cruz",
  phone: "+639171234567",
  region: "CALABARZON",
  province: "Batangas",
  city: "Lipa City",
  barangay: "Sabang",
  street: "123 Rizal St",
  landmark: "Near plaza",
  items: [
    { name: "Bio Plant Booster", qty: 2, priceCentavos: 25000 },
    { name: "Bio Enzyme", qty: 1, priceCentavos: 15000 },
  ],
  subtotalCentavos: 65000,
  shipping: { showFee: true, shippingCentavos: 12000, free: false },
  notes: "Leave at gate",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers(); // no-op unless a test installed fake timers (Task 5 timeout test)
});

describe("buildOrderEmail — HTML escaping (spec §4.4.1)", () => {
  it("escapes <script> in the buyer name in HTML but NOT in the subject", () => {
    const order = { ...base, name: '<script>alert("xss")</script>' };
    const { subject, html } = buildOrderEmail(order, "sheet-id");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    // Subject is a plain-text MIME header — never HTML-escaped:
    expect(subject).not.toContain("&lt;");
    expect(subject).toContain('<script>alert("xss")</script>');
  });

  it("escapes quotes and ampersands in the name (HTML body)", () => {
    const order = { ...base, name: `Juan "Totoy" O'Brien & Sons` };
    const { html } = buildOrderEmail(order, "sheet-id");
    expect(html).toContain("&quot;Totoy&quot;");
    expect(html).toContain("O&#39;Brien");
    expect(html).toContain("&amp; Sons");
  });

  it("escapes an <img onerror> payload in notes", () => {
    const order = { ...base, notes: '<img src=x onerror=alert(1)>' };
    const { html } = buildOrderEmail(order, "sheet-id");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes item names per line so '; ' or markup in a name cannot break the layout", () => {
    const order = {
      ...base,
      items: [{ name: "Weird; Name <b>", qty: 1, priceCentavos: 100 }],
    };
    const { html } = buildOrderEmail(order, "sheet-id");
    expect(html).toContain("Weird; Name &lt;b&gt; ×1 @₱1");
    expect(html).not.toContain("<b> ×1");
  });

  it("escapes address fields (street/barangay/city/province/region) in one comma-joined cell", () => {
    const order = { ...base, street: '12 "A" St <i>', city: "Lipa & Co" };
    const { html } = buildOrderEmail(order, "sheet-id");
    expect(html).toContain("12 &quot;A&quot; St &lt;i&gt;, Sabang, Lipa &amp; Co, Batangas, CALABARZON");
  });
});

describe("buildOrderEmail — subject (spec §4.3, §4.4.2)", () => {
  it("strips CRLF and control chars from the name (header-injection guard)", () => {
    const order = { ...base, name: "Juan\r\nBcc: evil@example.com\x07" };
    const { subject } = buildOrderEmail(order, "sheet-id");
    expect(subject).not.toMatch(/[\r\n]/);
    // eslint-disable-next-line no-control-regex
    expect(subject).not.toMatch(/[\x00-\x1f\x7f]/);
    expect(subject).toContain("JuanBcc: evil@example.com");
  });

  it("preserves emoji, ñ, and Filipino characters readable in subject and HTML", () => {
    const order = { ...base, name: "Señor José 🌾 Dalawang Bagsakan" };
    const { subject, html } = buildOrderEmail(order, "sheet-id");
    expect(subject).toContain("Señor José 🌾 Dalawang Bagsakan");
    expect(html).toContain("Señor José 🌾 Dalawang Bagsakan");
  });

  it("truncates the subject name at 64 code points without splitting surrogate pairs", () => {
    const order = { ...base, name: "🌾".repeat(70) };
    const { subject } = buildOrderEmail(order, "sheet-id");
    expect(subject).toContain("🌾".repeat(64));
    expect(subject).not.toContain("🌾".repeat(65));
    expect(subject).not.toContain("�");
  });

  it("whole-peso total: 'Bagong Order' prefix + em dash delimiters, NO decimal group", () => {
    // subtotal ₱1,250 + on-call shipping (adds 0) = ₱1,250 exactly
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: false, shippingCentavos: 0, free: false },
    };
    const { subject } = buildOrderEmail(order, "sheet-id");
    expect(subject.startsWith("Bagong Order NAG-")).toBe(true);
    // Literal em dash U+2014 — load-bearing for the Gmail retention filter:
    expect(subject).toMatch(/NAG-\S+ — ₱[\d,]+ — /);
    expect(subject).toContain("Bagong Order NAG-20260602-A7K1 — ₱1,250 — Juan Dela Cruz");
  });

  it("fractional total: decimal REQUIRED in both subject and HTML total cell", () => {
    // subtotal ₱1,200 + shipping fee ₱50.50 = ₱1,250.50 (spec §8 non-round money case)
    const order = {
      ...base,
      subtotalCentavos: 120000,
      shipping: { showFee: true, shippingCentavos: 5050, free: false },
    };
    const { subject, html } = buildOrderEmail(order, "sheet-id");
    expect(subject).toMatch(/NAG-\S+ — ₱[\d,]+\.\d{2} — /);
    expect(subject).toContain("₱1,250.50");
    expect(html).toContain("₱1,250.50");
  });

  it("uses the computed total (subtotal + fee) in the subject, never the subtotal alone", () => {
    // ₱1,250 subtotal + ₱150 fee = ₱1,400 (spec §4.3 example)
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: true, shippingCentavos: 15000, free: false },
    };
    const { subject } = buildOrderEmail(order, "sheet-id");
    expect(subject).toContain("— ₱1,400 —");
    expect(subject).not.toContain("— ₱1,250 —");
  });
});

describe("buildOrderEmail — money and shipping cells (spec §4.3)", () => {
  it("shipping fee: total = subtotal + fee; Shipping cell shows the fee", () => {
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: true, shippingCentavos: 15000, free: false },
    };
    const { html } = buildOrderEmail(order, "sheet-id");
    expect(html).toContain("₱1,400"); // total cell
    expect(html).toContain("₱1,250"); // subtotal cell
    expect(html).toContain("₱150"); // shipping cell
  });

  it("FREE shipping: total = subtotal, Shipping cell = 'FREE'", () => {
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: false, shippingCentavos: 0, free: true },
    };
    const { html, subject } = buildOrderEmail(order, "sheet-id");
    expect(html).toContain(">FREE<");
    expect(subject).toContain("— ₱1,250 —");
  });

  it("free:true overrides showFee:true — fee adds 0 (explicit free guard)", () => {
    // ShippingEstimate does not enforce mutual exclusivity; free must win.
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: true, shippingCentavos: 15000, free: true },
    };
    const { subject, html } = buildOrderEmail(order, "sheet-id");
    expect(subject).toContain("— ₱1,250 —");
    expect(subject).not.toContain("₱1,400");
    expect(html).toContain(">FREE<");
  });

  it("on-call shipping: total = subtotal, Shipping cell = copy.errors.shippingOnCall", () => {
    const order = {
      ...base,
      subtotalCentavos: 125000,
      shipping: { showFee: false, shippingCentavos: 0, free: false },
    };
    const { html, subject } = buildOrderEmail(order, "sheet-id");
    // Asserted against the copy bundle import, NOT a hardcoded literal (spec §8):
    expect(html).toContain(copy.errors.shippingOnCall);
    expect(subject).toContain("— ₱1,250 —");
  });
});

describe("buildOrderEmail — structure, labels, Sheet link (spec §4.3)", () => {
  it("uses the exact Filipino ops labels", () => {
    const { html } = buildOrderEmail(base, "sheet-id");
    for (const label of [
      "Order #",
      "Petsa/Oras",
      "Pangalan",
      "Telepono",
      "Address",
      "Landmark",
      "Mga Produkto",
      "Subtotal",
      "Shipping",
      "Kabuuan (Total)",
      "Notes",
    ]) {
      expect(html).toContain(label);
    }
  });

  it("renders items one per line joined with <br>, using Unicode ×", () => {
    const { html } = buildOrderEmail(base, "sheet-id");
    expect(html).toContain("Bio Plant Booster ×2 @₱250<br>Bio Enzyme ×1 @₱150");
  });

  it("includes a plaintext part with the same fields", () => {
    const { text } = buildOrderEmail(base, "sheet-id");
    expect(text).toContain("NAG-20260602-A7K1");
    expect(text).toContain("Pangalan: Juan Dela Cruz");
    expect(text).toContain("Telepono: +639171234567");
    expect(text).toContain("Bio Plant Booster ×2 @₱250");
    expect(text).toContain("Kabuuan (Total):");
  });

  it("wraps the body in a DOCTYPE/html/body shell with a max-width:600px table", () => {
    const { html } = buildOrderEmail(base, "sheet-id");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("max-width:600px");
    expect(html).not.toContain("<style>");
  });

  it("includes the Google Sheet footer link when sheetId is provided", () => {
    const { html } = buildOrderEmail(base, "sheet-abc-123");
    expect(html).toContain(
      'href="https://docs.google.com/spreadsheets/d/sheet-abc-123/edit"'
    );
  });

  it("omits the link when sheetId is an empty string", () => {
    const { html } = buildOrderEmail(base, "");
    expect(html).not.toContain("docs.google.com");
  });

  it("defaults sheetId to GOOGLE_SHEET_ID when not passed", () => {
    vi.stubEnv("GOOGLE_SHEET_ID", "env-sheet-id");
    const { html } = buildOrderEmail(base);
    expect(html).toContain("env-sheet-id");
  });

  it("omits the link when not passed and GOOGLE_SHEET_ID is unset", () => {
    vi.stubEnv("GOOGLE_SHEET_ID", "");
    const { html } = buildOrderEmail(base);
    expect(html).not.toContain("docs.google.com");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run __tests__/lib/notify-email.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/notify-email'` (or "Failed to resolve import"). Every test in the file errors. This is the red state.

- [ ] **Step 3: Implement the builder — create `src/lib/notify-email.ts`**

```ts
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
// eslint-disable-next-line no-control-regex
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
```

Note: the two `// eslint-disable-next-line no-control-regex` comments (one in the test, one in the module) are contingencies — `eslint-config-next` may not enable that rule. If `npm run lint` reports the disable comments themselves as unused (`--report-unused-disable-directives`), remove them; if lint passes either way, keep them.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run __tests__/lib/notify-email.test.ts
```

Expected: PASS — all builder tests green.

- [ ] **Step 5: Run the full suite + lint**

```bash
npm test
npm run lint
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/notify-email.ts __tests__/lib/notify-email.test.ts
git commit -m "feat(email): buildOrderEmail — owner order email builder

Pure builder: Filipino ops labels, HTML table body + plaintext part, em-dash
subject with control-char strip + 64-code-point truncate, HTML escaping on all
buyer fields, computed total with explicit free-shipping guard, optional Sheet
footer link. Spec 2026-06-02 §4.1/§4.3/§4.4.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: `sendNewOrderEmail` — Resend delivery (TDD)

**Files:**
- Modify: `__tests__/lib/notify-email.test.ts` (append sender tests)
- Modify: `src/lib/notify-email.ts` (append sender implementation)

- [ ] **Step 1: Write the failing sender tests**

In `__tests__/lib/notify-email.test.ts`:

(1a) Change the notify-email import line to also import the sender:

```ts
// OLD:
import { buildOrderEmail } from "@/lib/notify-email";
// NEW:
import { buildOrderEmail, sendNewOrderEmail } from "@/lib/notify-email";
```

(1b) Append these describe blocks at the end of the file:

```ts
// ─── sendNewOrderEmail (mocked fetch — spec §4.1 behavior, §8 cases) ─────────

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Both env vars set to a valid single-recipient config. */
function stubValidEnv(): void {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("ORDER_NOTIFY_EMAIL", "owner@example.com");
}

describe("sendNewOrderEmail — step-1 unset-config guard (silent no-op)", () => {
  it("(a) RESEND_API_KEY unset → no fetch, NO warn, NO error", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ORDER_NOTIFY_EMAIL", "owner@example.com");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn();

    await sendNewOrderEmail(base, fetchSpy as unknown as typeof fetch);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("(b) ORDER_NOTIFY_EMAIL unset → no fetch, NO warn, NO error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("ORDER_NOTIFY_EMAIL", "");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.fn();

    await sendNewOrderEmail(base, fetchSpy as unknown as typeof fetch);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

describe("sendNewOrderEmail — step-2 recipient parsing (misconfig warns)", () => {
  it("skips invalid entries with a warn and sends to the valid ones", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("ORDER_NOTIFY_EMAIL", "not-an-email, owner@example.com");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockFetch = vi.fn(async () => jsonResponse(200, { id: "re_1" }));

    await sendNewOrderEmail(base, mockFetch as unknown as typeof fetch);

    expect(warnSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: skipping invalid recipient",
      "not-an-email"
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(
      (mockFetch.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string
    );
    expect(body.to).toEqual(["owner@example.com"]);
  });

  it("zero valid recipients (all malformed) → distinct 'no valid recipients' warn, no fetch", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("ORDER_NOTIFY_EMAIL", "nope, also-bad@, @bad.com");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchSpy = vi.fn();

    await sendNewOrderEmail(base, fetchSpy as unknown as typeof fetch);

    expect(warnSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: ORDER_NOTIFY_EMAIL had no valid recipients, skipping"
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("', ,' (commas/spaces only — truthy but empty after parsing) → 'no valid recipients' warn, no fetch", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("ORDER_NOTIFY_EMAIL", ", ,");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchSpy = vi.fn();

    await sendNewOrderEmail(base, fetchSpy as unknown as typeof fetch);

    expect(warnSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: ORDER_NOTIFY_EMAIL had no valid recipients, skipping"
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("caps recipients at 5 (spec §4.4.4 forward-looking guard)", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv(
      "ORDER_NOTIFY_EMAIL",
      "a@x.com, b@x.com, c@x.com, d@x.com, e@x.com, f@x.com, g@x.com"
    );
    const mockFetch = vi.fn(async () => jsonResponse(200, { id: "re_1" }));

    await sendNewOrderEmail(base, mockFetch as unknown as typeof fetch);

    const body = JSON.parse(
      (mockFetch.mock.calls[0] as unknown as [string, RequestInit])[1]
        .body as string
    );
    expect(body.to).toHaveLength(5);
    expect(body.to).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "d@x.com",
      "e@x.com",
    ]);
  });
});

describe("sendNewOrderEmail — Resend POST and error handling", () => {
  it("200 success → resolves silently (no warn, no error)", async () => {
    stubValidEnv();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.fn(async () => jsonResponse(200, { id: "re_1" }));

    await expect(
      sendNewOrderEmail(base, mockFetch as unknown as typeof fetch)
    ).resolves.toBeUndefined();

    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("POSTs to the Resend endpoint with auth header, from, to, subject, html, and text", async () => {
    stubValidEnv();
    const mockFetch = vi.fn(async () => jsonResponse(200, { id: "re_1" }));

    await sendNewOrderEmail(base, mockFetch as unknown as typeof fetch);

    const [url, init] = mockFetch.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer re_test_key"
    );
    // The abort signal MUST be passed (spec §4.1 step 3):
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("Noel AgriTV <onboarding@resend.dev>");
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.subject).toContain("Bagong Order NAG-");
    expect(body.html).toContain("<!DOCTYPE html>");
    expect(body.text).toContain("Pangalan:");
  });

  it("403 with {error} body → logs status + error name/message, never throws", async () => {
    stubValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.fn(async () =>
      jsonResponse(403, {
        error: {
          name: "validation_error",
          message: "You can only send testing emails to your own email address",
        },
      })
    );

    await expect(
      sendNewOrderEmail(base, mockFetch as unknown as typeof fetch)
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail:",
      403,
      "validation_error",
      "You can only send testing emails to your own email address"
    );
  });

  it("429 with {error} body → logs status + error name/message, never throws", async () => {
    stubValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.fn(async () =>
      jsonResponse(429, {
        error: { name: "rate_limit_exceeded", message: "Too many requests" },
      })
    );

    await expect(
      sendNewOrderEmail(base, mockFetch as unknown as typeof fetch)
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail:",
      429,
      "rate_limit_exceeded",
      "Too many requests"
    );
  });

  it("non-JSON error body → guarded parse, logs parse-failure, never throws", async () => {
    stubValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.fn(
      async () => new Response("Internal Server Error", { status: 500 })
    );

    await expect(
      sendNewOrderEmail(base, mockFetch as unknown as typeof fetch)
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: failed to parse error response",
      expect.anything()
    );
  });

  it("network-level fetch rejection → logged, never throws", async () => {
    stubValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockFetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      sendNewOrderEmail(base, mockFetch as unknown as typeof fetch)
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: fetch failed",
      expect.anything()
    );
  });

  it("hung fetch → aborts at 8s and logs the timeout at console.error", async () => {
    stubValidEnv();
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    // A fetch that never resolves on its own; it rejects only when the abort
    // signal fires. If the implementation forgets to pass `signal`, this
    // promise never settles and the test times out — that failure is the point.
    const hungFetch = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("This operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        })
    );

    const promise = sendNewOrderEmail(
      base,
      hungFetch as unknown as typeof fetch
    );
    await vi.advanceTimersByTimeAsync(8000);
    await promise;

    expect(errorSpy).toHaveBeenCalledWith("sendNewOrderEmail: timed out after 8s");
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

```bash
npx vitest run __tests__/lib/notify-email.test.ts
```

Expected: FAIL — the import of `sendNewOrderEmail` errors ("does not provide an export named 'sendNewOrderEmail'"). The red state.

- [ ] **Step 3: Implement the sender — append to `src/lib/notify-email.ts`**

Append after `buildOrderEmail`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run __tests__/lib/notify-email.test.ts
```

Expected: PASS — all builder + sender tests green. If the hung-fetch test times out instead of passing, the implementation forgot `signal: controller.signal` in the fetch options — fix that, do not weaken the test.

- [ ] **Step 5: Run the full suite + lint**

```bash
npm test
npm run lint
```

Expected: all green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/notify-email.ts __tests__/lib/notify-email.test.ts
git commit -m "feat(email): sendNewOrderEmail — Resend delivery with guards and 8s timeout

Unset-config silent no-op, recipient parse/validate/cap-at-5, Resend POST with
abort timeout, structured error logging, parse-failure guard. Never throws to
the caller. Spec 2026-06-02 §4.1/§4.4.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Import-identity guard test (spec §4.3 / §8)

Proves both `buildOrderEmail` and `buildSheetRow` route formatting through the SAME `order-format.ts` exports — if a future change re-implements the three-branch shipping logic inline in either consumer, this test goes red even though value-assertion tests stay green. That failure mode is the entire point (spec §8).

**Files:**
- Modify: `__tests__/lib/notify-email.test.ts` (append one describe block)

- [ ] **Step 1: Append the import-identity tests**

Add to the imports at the top of `__tests__/lib/notify-email.test.ts` (after the existing imports — the `vi.mock("@/lib/order-format", { spy: true })` call is already there from Task 4):

```ts
import * as orderFormat from "@/lib/order-format";
import { buildSheetRow } from "@/lib/sheets";
```

Append this describe block at the end of the file:

```ts
// ─── Import-identity (spec §4.3 formatting drift rule, §8 integration) ───────

describe("import-identity: email and Sheet row share order-format.ts helpers", () => {
  it("buildOrderEmail routes item + shipping formatting through order-format.ts", () => {
    vi.mocked(orderFormat.formatOrderItem).mockClear();
    vi.mocked(orderFormat.formatShippingLabel).mockClear();

    buildOrderEmail(base, "sheet-id");

    expect(orderFormat.formatOrderItem).toHaveBeenCalledTimes(base.items.length);
    expect(orderFormat.formatShippingLabel).toHaveBeenCalledTimes(1);
  });

  it("buildSheetRow routes item + shipping formatting through the SAME order-format.ts helpers", () => {
    vi.mocked(orderFormat.formatOrderItems).mockClear();
    vi.mocked(orderFormat.formatShippingLabel).mockClear();

    buildSheetRow(base);

    expect(orderFormat.formatOrderItems).toHaveBeenCalledTimes(1);
    expect(orderFormat.formatShippingLabel).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npx vitest run __tests__/lib/notify-email.test.ts
```

Expected: PASS — both implementations already use the shared helpers (Tasks 2 and 4), so this test is green on arrival. It is a guard, not a driver.

If `vi.mock("@/lib/order-format", { spy: true })` is rejected by the installed Vitest version (it is supported in Vitest 3+; this project has Vitest 4), the fallback is a manual spy-preserving factory:

```ts
vi.mock("@/lib/order-format", async (orig) => {
  const real = await orig<typeof import("@/lib/order-format")>();
  return {
    formatOrderItem: vi.fn(real.formatOrderItem),
    formatOrderItems: vi.fn(real.formatOrderItems),
    formatShippingLabel: vi.fn(real.formatShippingLabel),
  };
});
```

Caveat for the fallback only: `formatOrderItems`'s internal call to `formatOrderItem` no longer goes through the spy, which is fine — the assertions above only count direct calls from the consumers.

- [ ] **Step 3: Run the full suite + lint**

```bash
npm test
npm run lint
```

Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add __tests__/lib/notify-email.test.ts
git commit -m "test(email): import-identity guard — email and Sheet share order-format helpers

Goes red if either consumer re-implements item/shipping formatting inline
instead of importing order-format.ts (spec 2026-06-02 §4.3 drift rule).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Checkout integration — `after()` wiring + test updates (ONE commit)

⚠ **Highest-risk task — touches the live order path.** The code change and the test changes MUST land in the same commit: the moment `actions.ts` calls `after()`, the existing `__tests__/app/checkout-actions.test.ts` goes red without the `next/server` mock (the real `after()` throws E468 "called outside a request scope" under vitest/jsdom). Spec §8 mandates the mock ships with the code change, never as a follow-up.

**Files:**
- Modify: `__tests__/app/checkout-actions.test.ts`
- Modify: `src/app/(storefront)/checkout/actions.ts`

- [ ] **Step 1: Update `__tests__/app/checkout-actions.test.ts` — mocks + new assertions**

(1a) After the existing `vi.mock("@/lib/admin-store", …)` block (currently ends near line 44), add the two new mocks:

```ts
// ── Order email notification (spec §4.2 / §8 integration) ────────────────────
// The real after() from next/server does workAsyncStorage.getStore() and throws
// E468 ("`after` was called outside a request scope") under vitest/jsdom — there
// is no Next request context here. Mock it to run the callback inline.
// MUST await cb(): the registered callback is async; a synchronous cb() call
// would only start the promise and assertions would race ahead of
// sendNewOrderEmail. Awaiting settles it before submitOrder resolves.
vi.mock("next/server", () => ({
  after: vi.fn(async (cb: () => void | Promise<void>) => {
    await cb();
  }),
}));

// Spy target for the email assertions. Without this mock the real
// sendNewOrderEmail runs (a silent no-op under unset env vars) and cannot be
// asserted on.
vi.mock("@/lib/notify-email", () => ({
  sendNewOrderEmail: vi.fn().mockResolvedValue(undefined),
}));
```

(1b) Extend the import block (currently `import { submitOrder } …` / `import { formatCentavos } …` near lines 46-47):

```ts
import { submitOrder } from "@/app/(storefront)/checkout/actions";
import { formatCentavos } from "@/lib/utils";
import { buildSheetRow, type OrderRowInput } from "@/lib/sheets";
import { sendNewOrderEmail } from "@/lib/notify-email";
import { after } from "next/server";
```

(Note: `buildSheetRow` here is the REAL implementation — the existing `@/lib/sheets` mock spreads the original module and only replaces `appendOrderRow`.)

(1c) Replace the existing `beforeEach` (currently `beforeEach(() => { appendOrderRow.mockClear(); });`) so the new mocks are also cleared between tests:

```ts
beforeEach(() => {
  appendOrderRow.mockClear();
  vi.mocked(after).mockClear();
  vi.mocked(sendNewOrderEmail).mockClear();
});
```

(1d) Append a new describe block at the end of the file:

```ts
describe("submitOrder → owner email notification via after() (spec §4.2)", () => {
  // Same valid item shape the existing test uses — server re-derives the real
  // tier price from the static catalog regardless of these client values.
  const items = [
    {
      slug: "bio-enzyme",
      name: "hacked",
      priceCentavos: 100,
      priceTiers: [{ minQty: 1, priceCentavos: 100 }],
      qty: 12,
      image: "/x.png",
    },
  ];

  it("(a)+(b) registers after() exactly once and emails the SAME orderInput the Sheet row was built from", async () => {
    const result = await submitOrder(payload(items));
    expect(result).toMatchObject({ ok: true });

    // (a) after() called exactly once per successful order:
    expect(after).toHaveBeenCalledTimes(1);

    // (b) the email's input rebuilds into EXACTLY the row that was appended —
    // proving both were fed the same orderInput object:
    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    const emailInput = vi.mocked(sendNewOrderEmail).mock
      .calls[0][0] as OrderRowInput;
    const appendedRow = appendOrderRow.mock.calls[0][0] as string[];
    expect(buildSheetRow(emailInput)).toEqual(appendedRow);

    // Spot-check the fields actually came through (guards against an empty
    // object that would also trivially "round-trip"):
    expect(emailInput).toMatchObject({
      name: "Juan dela Cruz",
      phone: "+639171234567",
      province: "Batangas",
      city: "Lipa City",
      barangay: "Sabang",
      street: "123 Rizal St",
    });
    expect(emailInput.orderNumber).toMatch(/^NAG-/);
    expect(emailInput.subtotalCentavos).toBe(624000); // 12 × ₱520 server tier
  });

  it("(c) a rejected email send is swallowed by the after() callback — order still succeeds", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(sendNewOrderEmail).mockRejectedValueOnce(
      new Error("resend down")
    );

    const result = await submitOrder(payload(items));

    expect(result).toMatchObject({ ok: true });
    expect(sendNewOrderEmail).toHaveBeenCalledTimes(1);
    // The callback's internal try/catch logged it:
    expect(errorSpy).toHaveBeenCalledWith(
      "sendNewOrderEmail: failed",
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("does NOT register after() or send email when the Sheets append fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    appendOrderRow.mockRejectedValueOnce(new Error("sheets down"));

    const result = await submitOrder(payload(items));

    expect(result).toMatchObject({ ok: false, error: "sheets" });
    expect(after).not.toHaveBeenCalled();
    expect(sendNewOrderEmail).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test file to verify the new tests fail (and the old one still passes)**

```bash
npx vitest run __tests__/app/checkout-actions.test.ts
```

Expected: the existing "recomputes the bulk tier price…" test PASSES (mocking `next/server` is harmless while `actions.ts` doesn't import it yet). Tests "(a)+(b)" and "(c)" FAIL (`after` / `sendNewOrderEmail` have 0 calls). The third new test ("does NOT register after()… when the Sheets append fails") PASSES even now — it is a negative guard; that is expected. This is the red state.

- [ ] **Step 3: Edit `src/app/(storefront)/checkout/actions.ts`**

(3a) Add two imports. `after` from `next/server` goes first; `sendNewOrderEmail` goes with the other `@/lib` imports; the `@/lib/sheets` import gains the `OrderRowInput` type:

```ts
// OLD (line 1-18 import block ends with):
import { appendOrderRow, buildSheetRow } from "@/lib/sheets";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

// NEW:
import { after } from "next/server";
import { appendOrderRow, buildSheetRow, type OrderRowInput } from "@/lib/sheets";
import { sendNewOrderEmail } from "@/lib/notify-email";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";
```

(The `"use server"` directive stays on line 1; `import { after } from "next/server"` is inserted at the top of the import block, immediately after the existing `import { … } from "@/lib/order";` group is fine too — exact position among imports does not matter, only that it is imported.)

(3b) Replace the section from the `normalizedPhone` declaration through the success `return` (currently lines 109–144). The orderInput literal is the existing inline literal moved **verbatim** — including the redundant-but-intentional `?? ""` on landmark/notes (spec §4.2: pure cut-and-paste extraction, not a refactor):

```ts
// OLD:
  const normalizedPhone = normalizePhPhone(data.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      error: "validation",
      message: copy.errors.formCheck,
    };
  }
  try {
    const row = buildSheetRow({
      orderNumber,
      timestampManila,
      name: data.name,
      phone: normalizedPhone,
      region: regionLabel,
      province: data.province,
      city: data.city,
      barangay: data.barangay,
      street: data.street,
      landmark: data.landmark ?? "",
      items,
      subtotalCentavos,
      shipping,
      notes: data.notes ?? "",
    });
    await appendOrderRow(row);
  } catch (e) {
    console.error("submitOrder: sheets append failed", e);
    return {
      ok: false,
      error: "sheets",
      message: copy.errors.submitFailed,
    };
  }

  return { ok: true, orderNumber };

// NEW:
  const normalizedPhone = normalizePhPhone(data.phone);
  if (!normalizedPhone) {
    return {
      ok: false,
      error: "validation",
      message: copy.errors.formCheck,
    };
  }

  // Declared AFTER the normalizedPhone guard (so TS has narrowed string | null
  // → string) and BEFORE the try (so it is in scope at the after() call below).
  // The same input feeds the Sheet row AND the owner email.
  const orderInput: OrderRowInput = {
    orderNumber,
    timestampManila,
    name: data.name,
    phone: normalizedPhone,
    region: regionLabel,
    province: data.province,
    city: data.city,
    barangay: data.barangay,
    street: data.street,
    landmark: data.landmark ?? "",
    items,
    subtotalCentavos,
    shipping,
    notes: data.notes ?? "",
  };

  try {
    const row = buildSheetRow(orderInput);
    await appendOrderRow(row);
  } catch (e) {
    console.error("submitOrder: sheets append failed", e);
    return {
      ok: false,
      error: "sheets",
      message: copy.errors.submitFailed,
    };
  }

  // 6. Owner email notification — fire-and-forget AFTER the response is sent.
  // Sits between the catch close and the success return so it registers ONLY
  // when the Sheets append succeeded (the failure path returned above). The
  // try/catch lives INSIDE the callback: after() itself registers synchronously
  // and never throws, so an outer try/catch would protect nothing. An email
  // failure can never fail the order — the response is already sent when this
  // callback runs (spec §4.2).
  after(async () => {
    try {
      await sendNewOrderEmail(orderInput);
    } catch (e) {
      console.error("sendNewOrderEmail: failed", e);
    }
  });

  return { ok: true, orderNumber };
```

- [ ] **Step 4: Run the test file to verify everything passes**

```bash
npx vitest run __tests__/app/checkout-actions.test.ts
```

Expected: PASS — all 4 tests (1 existing + 3 new).

- [ ] **Step 5: Run the full suite + lint**

```bash
npm test
npm run lint
```

Expected: all green. The full suite matters here — other test files exercise checkout components and must not be affected.

- [ ] **Step 6: Commit (code + tests together — never split)**

```bash
git add "src/app/(storefront)/checkout/actions.ts" __tests__/app/checkout-actions.test.ts
git commit -m "feat(checkout): owner email notification via after() on order success

Extracts the buildSheetRow argument into orderInput (verbatim) and registers
sendNewOrderEmail inside after() between the Sheets try/catch and the success
return — email fires only after a successful append, and an email failure can
never fail the order. Test file gains the mandatory next/server + notify-email
mocks in the same commit (real after() throws E468 under vitest). Spec
2026-06-02 §4.2/§8.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: `.env.example` — Resend provisioning block

**Files:**
- Modify: `.env.example` (append at end, after the Turnstile block)

- [ ] **Step 1: Append the block**

Append this exactly (verbatim from spec §6, including placeholder values) to the END of `.env.example`, separated by one blank line from the existing `TURNSTILE_SECRET_KEY=` last line:

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

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs(env): Resend provisioning block + RA 10173 owner ops checklist

Verbatim from spec 2026-06-02 §6 — account creation, sending-only API key,
Gmail auto-purge filter, post-rotation test-order verification.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Final verification

**Files:** none modified (unless a check fails).

- [ ] **Step 1: Full suite + lint, clean output required**

```bash
npm test
npm run lint
```

Expected: every test green, lint clean. Paste the actual summary output into the completion report — do not claim success without it.

- [ ] **Step 2: Verify every new file is git-tracked and the tree is clean**

```bash
git status --short
git log --oneline main..HEAD
```

Expected: empty `git status` (no untracked/modified files left); the log shows the commits from Tasks 2–8 on top of the spec commits.

- [ ] **Step 3: 390px privacy-notice layout check — BOTH languages (spec §5, project mobile-first rule)**

The privacy notice renders in `src/app/(storefront)/checkout/checkout-form.tsx` (line ~350, `{copy.checkout.privacyNotice}`). The new FIL string is ~40% longer than before; verify it doesn't break the 390px layout.

1. Ensure `.env.local` has `NEXT_PUBLIC_ECOMMERCE_ENABLED=true` (checkout is feature-gated). Do not commit `.env.local`.
2. `npm run dev`, wait for ready.
3. At 390×844 viewport: add any product to the cart, navigate to `/checkout`, scroll to the consent checkbox / privacy notice.
4. Verify in **Filipino** (default): the notice wraps cleanly, no horizontal overflow, no clipped text, checkbox + text both visible and tappable (≥48px touch target on the checkbox hit area).
5. Switch language to **English** (header language toggle) and repeat the check.
6. Also spot-check at ≥1024px (desktop) in both languages.
7. Screenshot all four states (FIL/EN × 390px/1024px) for the completion report.

Expected: no layout breakage in any of the four states. If the longer FIL string overflows or clips, fix the layout (never shorten the spec's approved copy) and re-run from Step 1.

- [ ] **Step 4: Done — report**

Completion report must include: test summary output, lint output, `git log --oneline main..HEAD`, the four layout screenshots, and confirmation that no spec requirement was skipped.

The report must also flag the two **client-action items from spec §5 that are NOT code** (so they are never silently dropped):
1. **NPC processor register (spec §5 item 2):** the client's NPC documentation must list Resend as a personal information processor, alongside Google (Sheets) and Cloudflare (Turnstile). Resend's DPA auto-applies via ToS acceptance — no signature needed.
2. **Resend account creation (spec §3):** the Resend account MUST be created with the exact inbox that should receive order notifications (the no-domain test sender only delivers to the account owner's own address).

---

## What this plan deliberately does NOT do (spec §7 — do not "improve")

- No staff CC / multi-recipient delivery (the cap-at-5 parser IS built — it is a safety rail, not a feature)
- No English/bilingual email variant, no `lang` parameter anywhere in the email path
- No admin-configurable recipient UI, no Resend SDK, no digest emails, no buyer-facing confirmation email
- No CSP changes, no `unstable_after` fallbacks, no `experimental.after` config
- No new doc files (`docs/setup-guide.md` is YAGNI — `.env.example` carries the ops checklist)
- No `__tests__/lib/order-format.test.ts` (covered via `sheets.test.ts` regression + `notify-email.test.ts`)

## Execution & QA strategy (project CLAUDE.md methodology)

- **Implementation sub-agents:** every task above is dispatched to an Opus sub-agent (`model: opus`) with the full task text as its brief. Tasks 2→7 are sequential (each builds on the previous); Tasks 3 and 8 are independent of the email modules and can run in parallel with Tasks 4–6.
- **QA tier (after Task 9):** review sub-agents on **Sonnet + Haiku + Opus in parallel**, each given the full diff (`git diff main...HEAD`) and the spec, asked to verify: (1) spec §4/§5/§8 conformance line-by-line, (2) security requirements §4.4, (3) test coverage vs §8's case list, (4) no scope creep into §7's cut list. Disagreements adjudicated by the orchestrator (Opus) reading the code directly.
- **Deterministic runs** (`npm test`, `npm run lint`) are run by the implementing agent itself and re-run by the Haiku QA agent.
