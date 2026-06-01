import { describe, it, expect } from "vitest";
import { adminToProduct } from "@/lib/admin-to-product";
import type { AdminProduct } from "@/lib/admin-store";

const base: AdminProduct = {
  id: "1",
  slug: "test",
  name: "Test",
  description: "A test product",
  image: "/x.png",
  categorySlug: "seeds",
  visible: true,
};

describe("adminToProduct priceCentavos", () => {
  it("passes through a set price", () => {
    expect(adminToProduct({ ...base, priceCentavos: 25000 }).priceCentavos).toBe(25000);
  });
  it("leaves price undefined when unset", () => {
    expect(adminToProduct(base).priceCentavos).toBeUndefined();
  });
});

describe("adminToProduct priceTiers", () => {
  it("carries priceTiers through to the storefront Product", () => {
    const tiers = [{ minQty: 1, priceCentavos: 57500 }, { minQty: 12, priceCentavos: 54000 }];
    const p = adminToProduct({ ...base, priceCentavos: 57500, priceTiers: tiers });
    expect(p.priceTiers).toEqual(tiers);
  });
  it("leaves priceTiers undefined when unset", () => {
    expect(adminToProduct(base).priceTiers).toBeUndefined();
  });
});

// A fully-bilingual admin product: every prose field has a Filipino base value
// AND an English counterpart.
const bilingual: AdminProduct = {
  ...base,
  description: "Pang-booster ng halaman",
  specs: [{ label: "Uri", value: "Likido" }],
  howToApply: "Idilig sa lupa",
  compatibleCrops: ["Palay", "Mais"],
  safetyNotes: "Ilayo sa mga bata",
  descriptionEn: "A plant booster",
  specsEn: [{ label: "Type", value: "Liquid" }],
  howToApplyEn: "Apply to soil",
  compatibleCropsEn: ["Rice", "Corn"],
  safetyNotesEn: "Keep away from children",
};

describe("adminToProduct language resolution", () => {
  it('lang "fil" (explicit) uses the Filipino base fields and ignores En fields', () => {
    const p = adminToProduct(bilingual, "fil");
    expect(p.description).toBe("Pang-booster ng halaman");
    expect(p.specs).toEqual([{ label: "Uri", value: "Likido" }]);
    expect(p.howToApply).toBe("Idilig sa lupa");
    expect(p.compatibleCrops).toEqual(["Palay", "Mais"]);
    expect(p.safetyNotes).toBe("Ilayo sa mga bata");
  });

  it("defaults to Filipino when lang is omitted (back-compat with old call sites)", () => {
    const p = adminToProduct(bilingual);
    expect(p.description).toBe("Pang-booster ng halaman");
    expect(p.specs).toEqual([{ label: "Uri", value: "Likido" }]);
  });

  it('lang "en" uses every English counterpart when all are present', () => {
    const p = adminToProduct(bilingual, "en");
    expect(p.description).toBe("A plant booster");
    expect(p.specs).toEqual([{ label: "Type", value: "Liquid" }]);
    expect(p.howToApply).toBe("Apply to soil");
    expect(p.compatibleCrops).toEqual(["Rice", "Corn"]);
    expect(p.safetyNotes).toBe("Keep away from children");
  });

  it('lang "en" falls back to Filipino for EVERY field when no En fields exist (legacy Blob record)', () => {
    const legacy: AdminProduct = {
      ...base,
      description: "Lumang produkto",
      specs: [{ label: "Uri", value: "Solid" }],
      howToApply: "Ihalo sa tubig",
      compatibleCrops: ["Gulay"],
      safetyNotes: "Itago sa malamig na lugar",
    };
    const p = adminToProduct(legacy, "en");
    expect(p.description).toBe("Lumang produkto");
    expect(p.specs).toEqual([{ label: "Uri", value: "Solid" }]);
    expect(p.howToApply).toBe("Ihalo sa tubig");
    expect(p.compatibleCrops).toEqual(["Gulay"]);
    expect(p.safetyNotes).toBe("Itago sa malamig na lugar");
  });

  it('lang "en" resolves each field INDEPENDENTLY — partial translation mixes EN + FIL', () => {
    // Only descriptionEn is provided; the rest must fall back to Filipino.
    const partial: AdminProduct = {
      ...base,
      description: "Pang-booster ng halaman",
      specs: [{ label: "Uri", value: "Likido" }],
      howToApply: "Idilig sa lupa",
      compatibleCrops: ["Palay"],
      safetyNotes: "Ilayo sa mga bata",
      descriptionEn: "A plant booster",
    };
    const p = adminToProduct(partial, "en");
    expect(p.description).toBe("A plant booster"); // English present
    expect(p.specs).toEqual([{ label: "Uri", value: "Likido" }]); // FIL fallback
    expect(p.howToApply).toBe("Idilig sa lupa"); // FIL fallback
    expect(p.compatibleCrops).toEqual(["Palay"]); // FIL fallback
    expect(p.safetyNotes).toBe("Ilayo sa mga bata"); // FIL fallback
  });

  it("oneLiner derives from the language-resolved description", () => {
    const longFil = "F".repeat(150);
    const longEn = "E".repeat(150);
    const p = adminToProduct(
      { ...base, description: longFil, descriptionEn: longEn },
      "en"
    );
    // truncated English description (100 chars + ellipsis)
    expect(p.oneLiner).toBe("E".repeat(100) + "...");
  });
});
