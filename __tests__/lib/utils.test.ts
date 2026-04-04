import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils";

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
