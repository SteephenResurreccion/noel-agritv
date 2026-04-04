import { describe, it, expect } from "vitest";
import {
  products,
  getProductBySlug,
  getProductsByCategory,
  getAllSlugs,
} from "@/data/products";
import { categories, getCategoryBySlug } from "@/data/categories";

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

  it("every product has at least one variant with price > 0", () => {
    for (const product of products) {
      expect(product.variants.length).toBeGreaterThan(0);
      for (const variant of product.variants) {
        expect(variant.price).toBeGreaterThan(0);
      }
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

describe("categories data", () => {
  it("has exactly 2 categories", () => {
    expect(categories).toHaveLength(2);
  });

  it("getCategoryBySlug returns correct category", () => {
    const category = getCategoryBySlug("seeds");
    expect(category).toBeDefined();
    expect(category!.name).toBe("Seeds");
  });
});
