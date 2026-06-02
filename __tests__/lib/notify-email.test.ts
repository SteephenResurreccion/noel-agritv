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
