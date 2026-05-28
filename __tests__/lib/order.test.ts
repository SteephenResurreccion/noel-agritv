import { describe, it, expect } from "vitest";
import {
  normalizePhPhone,
  generateOrderNumber,
  checkoutSchema,
  buildCheckoutPayload,
} from "@/lib/order";

describe("normalizePhPhone", () => {
  it("normalizes 09XXXXXXXXX to +639XXXXXXXXX", () => {
    expect(normalizePhPhone("09171234567")).toBe("+639171234567");
  });
  it("accepts +639XXXXXXXXX", () => {
    expect(normalizePhPhone("+639171234567")).toBe("+639171234567");
  });
  it("accepts 639XXXXXXXXX", () => {
    expect(normalizePhPhone("639171234567")).toBe("+639171234567");
  });
  it("strips spaces and dashes", () => {
    expect(normalizePhPhone("0917-123-4567")).toBe("+639171234567");
  });
  it("rejects a landline", () => {
    expect(normalizePhPhone("0281234567")).toBeNull();
  });
  it("rejects too-short numbers", () => {
    expect(normalizePhPhone("0917123")).toBeNull();
  });
  it("rejects non-PH numbers", () => {
    expect(normalizePhPhone("+14155550123")).toBeNull();
  });
});

describe("generateOrderNumber", () => {
  it("matches NAG-YYYYMMDD-XXXX with base-36 uppercase suffix", () => {
    expect(generateOrderNumber(new Date("2026-05-21T03:00:00Z"))).toMatch(
      /^NAG-\d{8}-[0-9A-Z]{4}$/
    );
  });
  it("uses Asia/Manila date (UTC 16:30 on May 21 is already May 22 in Manila)", () => {
    // 2026-05-21T16:30:00Z = 2026-05-22 00:30 Manila (+08:00)
    expect(generateOrderNumber(new Date("2026-05-21T16:30:00Z"))).toMatch(
      /^NAG-20260522-/
    );
  });
});

describe("checkoutSchema", () => {
  const valid = {
    name: "Juan",
    phone: "09171234567",
    region: "NCR",
    province: "Metro Manila",
    city: "Quezon City",
    barangay: "Commonwealth",
    street: "123 Main St",
    consent: true,
    items: [
      { slug: "x", name: "X", priceCentavos: 25000, qty: 1, image: "/x.png" },
    ],
    turnstileToken: "tok",
  };
  it("accepts a valid payload", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });
  it("rejects when consent is not true", () => {
    expect(checkoutSchema.safeParse({ ...valid, consent: false }).success).toBe(
      false
    );
  });
  it("rejects an invalid phone", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, phone: "0281234567" }).success
    ).toBe(false);
  });
  it("rejects an empty cart", () => {
    expect(checkoutSchema.safeParse({ ...valid, items: [] }).success).toBe(
      false
    );
  });
  it("rejects a missing turnstile token", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, turnstileToken: "" }).success
    ).toBe(false);
  });
});

describe("buildCheckoutPayload", () => {
  it("assembles a payload that passes checkoutSchema", () => {
    const payload = buildCheckoutPayload(
      {
        name: "Juan",
        phone: "09171234567",
        region: "NCR",
        province: "Metro Manila",
        city: "QC",
        barangay: "Commonwealth",
        street: "123 Main",
        landmark: "",
        notes: "",
        consent: true,
      },
      [{ slug: "x", name: "X", priceCentavos: 25000, qty: 2, image: "/x.png" }],
      "tok"
    );
    expect(checkoutSchema.safeParse(payload).success).toBe(true);
  });
});
