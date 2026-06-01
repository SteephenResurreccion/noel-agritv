import { describe, it, expect } from "vitest";
import {
  products,
  getProductBySlug,
  getProductsByCategory,
  getAllSlugs,
  localizeProduct,
  type LocalizedString,
} from "@/data/products";
import {
  categories,
  getCategoryBySlug,
  localizeCategory,
} from "@/data/categories";

/** Assert a LocalizedString carries non-empty prose in BOTH languages. */
function expectBilingual(s: LocalizedString) {
  expect(s.fil.length).toBeGreaterThan(0);
  expect(s.en.length).toBeGreaterThan(0);
}

describe("products data", () => {
  it("has exactly 4 products", () => {
    expect(products).toHaveLength(4);
  });

  it("every product has a valid category reference", () => {
    for (const product of products) {
      const category = getCategoryBySlug(product.categorySlug);
      expect(category).toBeDefined();
    }
  });

  it("every product slug is unique", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every product has exactly 4 specs", () => {
    for (const product of products) {
      expect(product.specs).toHaveLength(4);
    }
  });

  it("getProductBySlug returns correct product", () => {
    const product = getProductBySlug("bio-enzyme");
    expect(product).toBeDefined();
    expect(product!.name).toBe("Bio Enzyme");
  });

  it("getProductBySlug returns undefined for unknown slug", () => {
    expect(getProductBySlug("nonexistent")).toBeUndefined();
  });

  it("getProductsByCategory filters correctly", () => {
    const cropCare = getProductsByCategory("crop-care");
    expect(cropCare).toHaveLength(2);
    expect(cropCare.every((p) => p.categorySlug === "crop-care")).toBe(true);

    const seeds = getProductsByCategory("seeds");
    expect(seeds).toHaveLength(2);
  });

  it("getAllSlugs matches expected slugs", () => {
    const slugs = getAllSlugs();
    expect(slugs).toContain("bio-plant-booster");
    expect(slugs).toContain("bio-enzyme");
    expect(slugs).toContain("jasmine-479-rice-seeds");
    expect(slugs).toContain("mayumi-rice-seeds");
  });
});

describe("products bilingual source data", () => {
  it("every prose field carries non-empty fil AND en", () => {
    for (const p of products) {
      expectBilingual(p.oneLiner);
      expectBilingual(p.description);
      for (const spec of p.specs) {
        expectBilingual(spec.label);
        expectBilingual(spec.value);
      }
      for (const crop of p.compatibleCrops) {
        expectBilingual(crop);
      }
      if (p.howToApply) expectBilingual(p.howToApply);
      if (p.safetyNotes) expectBilingual(p.safetyNotes);
    }
  });

  it("localizeProduct('fil') resolves to the fil values from the source", () => {
    for (const p of products) {
      const r = localizeProduct(p, "fil");
      // Non-prose fields pass through unchanged.
      expect(r.slug).toBe(p.slug);
      expect(r.name).toBe(p.name);
      expect(r.categorySlug).toBe(p.categorySlug);
      expect(r.priceCentavos).toBe(p.priceCentavos);
      expect(r.priceTiers).toEqual(p.priceTiers);
      expect(r.youtubeId).toBe(p.youtubeId);
      // Prose collapses to the fil branch (asserted against the data, never
      // hardcoded strings).
      expect(r.oneLiner).toBe(p.oneLiner.fil);
      expect(r.description).toBe(p.description.fil);
      expect(r.specs).toEqual(
        p.specs.map((s) => ({ label: s.label.fil, value: s.value.fil }))
      );
      expect(r.compatibleCrops).toEqual(p.compatibleCrops.map((c) => c.fil));
      expect(r.howToApply).toBe(p.howToApply ? p.howToApply.fil : null);
      expect(r.safetyNotes).toBe(p.safetyNotes ? p.safetyNotes.fil : null);
    }
  });

  it("localizeProduct('en') resolves to the en values from the source", () => {
    for (const p of products) {
      const r = localizeProduct(p, "en");
      expect(r.oneLiner).toBe(p.oneLiner.en);
      expect(r.description).toBe(p.description.en);
      expect(r.specs).toEqual(
        p.specs.map((s) => ({ label: s.label.en, value: s.value.en }))
      );
      expect(r.compatibleCrops).toEqual(p.compatibleCrops.map((c) => c.en));
      expect(r.howToApply).toBe(p.howToApply ? p.howToApply.en : null);
      expect(r.safetyNotes).toBe(p.safetyNotes ? p.safetyNotes.en : null);
    }
  });
});

describe("categories data", () => {
  it("has exactly 2 categories", () => {
    expect(categories).toHaveLength(2);
  });

  it("getCategoryBySlug returns correct category", () => {
    const category = getCategoryBySlug("seeds");
    expect(category).toBeDefined();
    // Source carries a LocalizedString name; assert it resolves to the same
    // record in the categories array rather than a hardcoded string.
    expect(category!.name).toEqual(
      categories.find((c) => c.slug === "seeds")!.name
    );
  });
});

describe("categories bilingual source data", () => {
  it("every prose field carries non-empty fil AND en", () => {
    for (const c of categories) {
      expectBilingual(c.name);
      expectBilingual(c.subtitle);
    }
  });

  it("localizeCategory resolves each language from the source", () => {
    for (const c of categories) {
      const fil = localizeCategory(c, "fil");
      expect(fil.slug).toBe(c.slug);
      expect(fil.image).toBe(c.image);
      expect(fil.name).toBe(c.name.fil);
      expect(fil.subtitle).toBe(c.subtitle.fil);

      const en = localizeCategory(c, "en");
      expect(en.name).toBe(c.name.en);
      expect(en.subtitle).toBe(c.subtitle.en);
    }
  });
});
