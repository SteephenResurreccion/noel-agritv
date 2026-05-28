import { describe, it, expect } from "vitest";
import { PH_REGIONS, zoneForRegion } from "@/lib/ph-regions";

describe("PH regions", () => {
  it("has exactly 17 regions", () => {
    expect(PH_REGIONS).toHaveLength(17);
  });
  it("maps NCR to ncr", () => {
    expect(zoneForRegion("NCR")).toBe("ncr");
  });
  it("maps Region V (Bicol) to luzon", () => {
    expect(zoneForRegion("REGION_5")).toBe("luzon");
  });
  it("maps Region VII to visayas", () => {
    expect(zoneForRegion("REGION_7")).toBe("visayas");
  });
  it("maps BARMM to mindanao", () => {
    expect(zoneForRegion("BARMM")).toBe("mindanao");
  });
  it("returns null for an unknown region", () => {
    expect(zoneForRegion("ATLANTIS")).toBeNull();
  });
});
