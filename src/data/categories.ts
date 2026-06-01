import type { Lang } from "@/lib/copy";
import type { LocalizedString } from "@/data/products";

/**
 * Bilingual category seed data. Same pattern as `products.ts`: `CategorySource`
 * carries both languages; `localizeCategory(c, lang)` resolves to the FROZEN
 * single-language `Category` shape consumers already expect.
 *
 * Pairing rule: `fil` = current (live) Filipino value; `en` = original English
 * (git 87d042b). `slug` / `image` are single, shared values.
 */

/** Resolved single-language category view — FROZEN shape (unchanged). */
export interface Category {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
}

/** Bilingual category seed shape — the source of truth. */
export interface CategorySource {
  slug: string; // unchanged — single
  name: LocalizedString;
  subtitle: LocalizedString;
  image: string; // unchanged — single
}

export const categories: CategorySource[] = [
  {
    slug: "crop-care",
    name: { fil: "Pangalaga sa Pananim", en: "Crop Care" },
    subtitle: { fil: "Mga Booster at Enzyme", en: "Boosters & Enzymes" },
    image: "/images/categories/crop-care.webp",
  },
  {
    slug: "seeds",
    name: { fil: "Mga Binhi", en: "Seeds" },
    subtitle: { fil: "Mga Uri ng Palay", en: "Rice Varieties" },
    image: "/images/categories/seeds.webp",
  },
];

/** Resolve a bilingual `CategorySource` to the single-language `Category` shape. */
export function localizeCategory(c: CategorySource, lang: Lang): Category {
  return {
    slug: c.slug,
    name: c.name[lang],
    subtitle: c.subtitle[lang],
    image: c.image,
  };
}

export function getCategoryBySlug(slug: string): CategorySource | undefined {
  return categories.find((c) => c.slug === slug);
}

/** Convenience: all seed categories resolved to one language. */
export function getLocalizedCategories(lang: Lang): Category[] {
  return categories.map((c) => localizeCategory(c, lang));
}
