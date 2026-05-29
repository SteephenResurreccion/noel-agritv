import { describe, it, expect } from "vitest";
import {
  lookupSchema,
  findOrderInRows,
  summarizeRow,
  isOrderNumber,
} from "@/lib/lookup";

/**
 * The sheet's spec §7 column order — used to build representative test rows
 * and assert that summarizeRow extracts only the buyer-visible columns.
 *
 * 17 columns:
 *   A Order#  B Timestamp  C Name  D Phone  E Region  F Province  G City
 *   H Barangay  I Street  J Landmark  K Items  L Subtotal  M Shipping
 *   N Notes  O Status  P J&T Tracking#  Q Staff notes
 */
function buildRow(overrides: Partial<Record<number, string>> = {}): string[] {
  const row = [
    "NAG-20260521-A7K1", // A Order#
    "2026-05-21 14:30:00", // B Timestamp
    "Juan Dela Cruz", // C Name
    "+639171234567", // D Phone
    "NCR (Metro Manila)", // E Region
    "Metro Manila", // F Province
    "Quezon City", // G City
    "Commonwealth", // H Barangay
    "123 Main St", // I Street
    "Near plaza", // J Landmark
    "Bio Plant Booster ×2 @₱250; Bio Enzyme ×1 @₱150", // K Items
    "₱650", // L Subtotal
    "₱120", // M Shipping
    "Leave at gate", // N Notes
    "NEW", // O Status
    "", // P J&T Tracking#
    "", // Q Staff notes
  ];
  for (const [i, v] of Object.entries(overrides)) {
    row[Number(i)] = v ?? "";
  }
  return row;
}

describe("lookupSchema", () => {
  it("accepts a canonical order number, 4-digit phone tail, and a token", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "4567",
      turnstileToken: "test-token",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a missing or empty Turnstile token", () => {
    const missing = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "4567",
    });
    expect(missing.success).toBe(false);
    const empty = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "4567",
      turnstileToken: "",
    });
    expect(empty.success).toBe(false);
  });

  it("rejects an order number missing the NAG- prefix", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "20260521-A7K1",
      phoneLast4: "4567",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an order number with the wrong date length", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-2026521-A7K1",
      phoneLast4: "4567",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an order number with lowercase suffix", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-a7k1",
      phoneLast4: "4567",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an order number with a 3-char suffix", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K",
      phoneLast4: "4567",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a phone tail with non-digits", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "45a7",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a phone tail with fewer than 4 digits", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "456",
    });
    expect(r.success).toBe(false);
  });

  it("rejects a phone tail with more than 4 digits", () => {
    const r = lookupSchema.safeParse({
      orderNumber: "NAG-20260521-A7K1",
      phoneLast4: "45678",
    });
    expect(r.success).toBe(false);
  });
});

describe("isOrderNumber (parse-boundary guard)", () => {
  it("accepts a canonical order number", () => {
    expect(isOrderNumber("NAG-20260529-KX6S")).toBe(true);
  });

  it("rejects a human-friendly header label", () => {
    expect(isOrderNumber("Order Number")).toBe(false);
    expect(isOrderNumber("Order#")).toBe(false);
  });

  it("rejects blank, whitespace, and undefined cells", () => {
    expect(isOrderNumber("")).toBe(false);
    expect(isOrderNumber("   ")).toBe(false);
    expect(isOrderNumber(undefined)).toBe(false);
  });

  it("rejects near-misses (lowercase suffix, wrong date length, no prefix)", () => {
    expect(isOrderNumber("NAG-20260529-kx6s")).toBe(false);
    expect(isOrderNumber("NAG-2026529-KX6S")).toBe(false);
    expect(isOrderNumber("20260529-KX6S")).toBe(false);
  });
});

describe("findOrderInRows", () => {
  it("returns the matching row when order# and phone tail match", () => {
    const rows = [buildRow(), buildRow({ 0: "NAG-20260521-Z9Z9" })];
    const hit = findOrderInRows(rows, "NAG-20260521-A7K1", "4567");
    expect(hit).not.toBeNull();
    expect(hit![0]).toBe("NAG-20260521-A7K1");
  });

  it("returns null when the order# matches but the phone tail does not", () => {
    const rows = [buildRow()];
    const hit = findOrderInRows(rows, "NAG-20260521-A7K1", "9999");
    expect(hit).toBeNull();
  });

  it("returns null when neither order# nor phone matches", () => {
    const rows = [buildRow()];
    const hit = findOrderInRows(rows, "NAG-20260521-XXXX", "4567");
    expect(hit).toBeNull();
  });

  it("returns null on an empty rows array", () => {
    expect(findOrderInRows([], "NAG-20260521-A7K1", "4567")).toBeNull();
  });

  it("ignores a human-friendly header row (column A is not an order #)", () => {
    // The header the client pastes into row 1 of the live Sheet.
    const header = [
      "Order Number",
      "Order Date",
      "Customer Name",
      "Phone Number",
      "Region",
      "Province",
      "City / Municipality",
      "Barangay",
      "Street / House No.",
      "Landmark",
      "Items",
      "Subtotal",
      "Shipping",
      "Customer Notes",
      "Status",
      "J&T Tracking Number",
      "Staff Notes",
    ];
    const rows = [header, buildRow()];
    const hit = findOrderInRows(rows, "NAG-20260521-A7K1", "4567");
    expect(hit).not.toBeNull();
    expect(hit![0]).toBe("NAG-20260521-A7K1");
  });

  it("ignores a fully blank row and still returns a valid order below it", () => {
    const blank = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""];
    const rows = [blank, buildRow()];
    const hit = findOrderInRows(rows, "NAG-20260521-A7K1", "4567");
    expect(hit).not.toBeNull();
    expect(hit![0]).toBe("NAG-20260521-A7K1");
  });

  it("never matches a non-order row even when its column A equals the query", () => {
    // Junk row whose column A is not a valid order #: must never be parsed as
    // an order, even if a (malformed) lookup happened to pass the same string.
    const junk = buildRow({ 0: "not-an-order" });
    expect(findOrderInRows([junk], "not-an-order", "4567")).toBeNull();
  });

  it("strips non-digits from the sheet's phone column before comparing", () => {
    // Defensive: even if staff edits the phone with spaces/dashes the last-4
    // match should still work.
    const rows = [buildRow({ 3: "+63 917 123-4567" })];
    const hit = findOrderInRows(rows, "NAG-20260521-A7K1", "4567");
    expect(hit).not.toBeNull();
  });

  it("returns the first match when duplicates exist (defensive)", () => {
    const r1 = buildRow();
    const r2 = buildRow();
    const hit = findOrderInRows([r1, r2], "NAG-20260521-A7K1", "4567");
    expect(hit).toBe(r1);
  });

  it("returns null when the row is too short to contain the phone column", () => {
    const shortRow = ["NAG-20260521-A7K1", "ts"];
    const hit = findOrderInRows([shortRow], "NAG-20260521-A7K1", "4567");
    expect(hit).toBeNull();
  });
});

describe("summarizeRow", () => {
  it("extracts only the buyer-visible columns", () => {
    const summary = summarizeRow(buildRow({ 15: "JT9988776655" }));
    expect(summary).toEqual({
      orderNumber: "NAG-20260521-A7K1",
      status: "NEW",
      itemsLine: "Bio Plant Booster ×2 @₱250; Bio Enzyme ×1 @₱150",
      subtotal: "₱650",
      shipping: "₱120",
      trackingNumber: "JT9988776655",
    });
  });

  it("returns an empty trackingNumber when the sheet has no tracking yet", () => {
    const summary = summarizeRow(buildRow());
    expect(summary.trackingNumber).toBe("");
  });

  it("returns raw status from sheet (Confirmed, Booked, etc.) untouched", () => {
    const summary = summarizeRow(buildRow({ 14: "Confirmed" }));
    expect(summary.status).toBe("Confirmed");
  });

  it("does NOT include name, phone, address, or notes (privacy)", () => {
    const summary = summarizeRow(buildRow());
    // Compile-time guarantee — but assert at runtime as well.
    expect(summary).not.toHaveProperty("name");
    expect(summary).not.toHaveProperty("phone");
    expect(summary).not.toHaveProperty("region");
    expect(summary).not.toHaveProperty("province");
    expect(summary).not.toHaveProperty("city");
    expect(summary).not.toHaveProperty("barangay");
    expect(summary).not.toHaveProperty("street");
    expect(summary).not.toHaveProperty("landmark");
    expect(summary).not.toHaveProperty("notes");
  });

  it("defaults missing trailing columns to an empty string", () => {
    // A row could be shorter than 17 if Sheets trims trailing blanks.
    const shortRow = [
      "NAG-20260521-A7K1",
      "2026-05-21 14:30:00",
      "Juan",
      "+639171234567",
      "NCR",
      "MM",
      "QC",
      "Bgy",
      "Street",
      "Landmark",
      "Items",
      "₱100",
      "₱0",
      "",
      "NEW",
      // P and Q omitted
    ];
    const summary = summarizeRow(shortRow);
    expect(summary.trackingNumber).toBe("");
  });
});
