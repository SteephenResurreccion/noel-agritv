import { describe, it, expect } from "vitest";
import { formatPrice, formatCentavos } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats small amounts without comma", () => {
    expect(formatPrice(350)).toBe("₱350");
  });

  it("formats thousands with comma", () => {
    expect(formatPrice(1000)).toBe("₱1,000");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("₱0");
  });
});

describe("formatCentavos", () => {
  it("formats whole pesos without decimals", () => {
    expect(formatCentavos(25000)).toBe("₱250");
  });
  it("formats fractional pesos with two decimals", () => {
    expect(formatCentavos(25050)).toBe("₱250.50");
  });
  it("formats thousands with a comma", () => {
    expect(formatCentavos(123450)).toBe("₱1,234.50");
  });
  it("formats zero", () => {
    expect(formatCentavos(0)).toBe("₱0");
  });
});
