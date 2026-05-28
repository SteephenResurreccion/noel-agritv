import { describe, it, expect } from "vitest";
import { buildSheetRow, type OrderRowInput } from "@/lib/sheets";

const base: OrderRowInput = {
  orderNumber: "NAG-20260521-A7K1",
  timestampManila: "2026-05-21 14:30:00",
  name: "Juan",
  phone: "+639171234567",
  region: "NCR (Metro Manila)",
  province: "Metro Manila",
  city: "Quezon City",
  barangay: "Commonwealth",
  street: "123 Main St",
  landmark: "Near plaza",
  items: [
    { name: "Bio Plant Booster", qty: 2, priceCentavos: 25000 },
    { name: "Bio Enzyme", qty: 1, priceCentavos: 15000 },
  ],
  subtotalCentavos: 65000,
  shipping: { showFee: true, shippingCentavos: 12000 },
  notes: "Leave at gate",
};

describe("buildSheetRow", () => {
  it("produces 17 columns in spec order", () => {
    const row = buildSheetRow(base);
    expect(row).toHaveLength(17);
    expect(row[0]).toBe("NAG-20260521-A7K1");
    expect(row[1]).toBe("2026-05-21 14:30:00");
    expect(row[10]).toBe("Bio Plant Booster ×2 @₱250; Bio Enzyme ×1 @₱150");
    expect(row[11]).toBe("₱650");
    expect(row[12]).toBe("₱120");
    expect(row[14]).toBe("NEW");
    expect(row[15]).toBe(""); // J&T tracking blank
    expect(row[16]).toBe(""); // staff notes blank
  });
  it("writes 'Confirmed on call' when shipping is not shown", () => {
    const row = buildSheetRow({ ...base, shipping: { showFee: false, shippingCentavos: 0 } });
    expect(row[12]).toBe("Confirmed on call");
  });
});
