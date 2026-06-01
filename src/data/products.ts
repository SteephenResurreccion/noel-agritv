import type { Lang } from "@/lib/copy";
import type { PriceTier } from "@/lib/pricing";

/**
 * Bilingual product seed data with server-side language resolution.
 *
 * The SOURCE of truth carries BOTH Filipino and English prose (`ProductSource`,
 * `LocalizedString`). Per request, the server resolves a source product to the
 * single-language `Product` shape via `localizeProduct(p, lang)` — so client
 * components receive exactly ONE language's strings (hard constraint: budget
 * phones + 150KB JS budget; never ship both languages of prose to the browser).
 *
 * The `Product` / `ProductSpec` interfaces are FROZEN — identical to before this
 * file went bilingual — so every existing consumer's prop shapes are unchanged.
 *
 * Pairing rule: `fil` = the current (live) Filipino value; `en` = the original
 * English value (git 87d042b). Non-prose fields (slug, brand name, prices,
 * images, youtubeId, tiers) are single, shared values — verified identical
 * across both language versions.
 */

/** A user-facing string carried in both languages in seed data. */
export type LocalizedString = { fil: string; en: string };

/** A spec row whose label AND value are both bilingual. */
export type LocalizedSpec = { label: LocalizedString; value: LocalizedString };

/** Resolved single-language spec — FROZEN shape (unchanged from pre-bilingual). */
export interface ProductSpec {
  label: string;
  value: string;
}

/** Resolved single-language product view — FROZEN shape (unchanged). */
export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  oneLiner: string;
  description: string;
  specs: ProductSpec[];
  image: string;
  imageLarge: string;
  priceCentavos?: number; // integer centavos; undefined/absent ⇒ inquiry-only (no Add-to-cart)
  priceTiers?: PriceTier[]; // ascending by minQty; first minQty = 1
  youtubeId: string | null;
  compatibleCrops: string[];
  howToApply: string | null;
  safetyNotes: string | null;
}

/** Bilingual seed shape — the source of truth for product data. */
export interface ProductSource {
  slug: string; // unchanged — single
  name: string; // brand name — single, untranslated
  categorySlug: string; // unchanged — single
  oneLiner: LocalizedString;
  description: LocalizedString;
  specs: LocalizedSpec[];
  image: string; // unchanged — single
  imageLarge: string; // unchanged — single
  priceCentavos?: number; // unchanged — single
  priceTiers?: PriceTier[]; // unchanged — single
  youtubeId: string | null; // unchanged — single
  compatibleCrops: LocalizedString[];
  howToApply: LocalizedString | null;
  safetyNotes: LocalizedString | null;
}

export const products: ProductSource[] = [
  {
    slug: "bio-plant-booster",
    name: "Bio Plant Booster",
    categorySlug: "crop-care",
    oneLiner: {
      fil: "Bio-fertilizer foliar at soil conditioner para sa mas malusog na pananim",
      en: "Bio-fertilizer foliar and soil conditioner for healthier crops",
    },
    description: {
      fil: "Ang Bio Plant Booster ay isang bio-fertilizer growth enhancer na ginawa para pagandahin ang kalusugan ng lupa at pasiglahin ang paglaki ng halaman. Naglalaman ito ng kapaki-pakinabang na mikroorganismo na tumutulong masira ang organic matter, para mas makuha ng halaman ang sustansya. Ang regular na paggamit ay nagpapatibay ng ugat, nagpapaganda ng pagsipsip ng sustansya, at nagpapataas ng ani.",
      en: "Bio Plant Booster is a bio-fertilizer growth enhancer formulated to improve soil health and stimulate plant growth. It contains beneficial microorganisms that help break down organic matter, making nutrients more available to plants. Regular application promotes stronger root development, better nutrient uptake, and improved crop yields.",
    },
    specs: [
      {
        label: { fil: "Uri", en: "Type" },
        value: { fil: "Likido", en: "Liquid" },
      },
      {
        label: { fil: "Paggamit", en: "Application" },
        value: { fil: "Foliar / Pagdidilig sa Lupa", en: "Foliar / Soil Drench" },
      },
      {
        label: { fil: "Angkop Para Sa", en: "Suitable For" },
        value: { fil: "Palay, Mais, Gulay", en: "Rice, Corn, Vegetables" },
      },
      {
        label: { fil: "Aktibong Sangkap", en: "Active Ingredient" },
        value: {
          fil: "Bio-fertilizer na mikroorganismo",
          en: "Bio-fertilizer microorganisms",
        },
      },
    ],
    image: "/images/products/bio-plant-booster.webp",
    imageLarge: "/images/products/bio-plant-booster-lg.webp",
    priceCentavos: 57500,
    priceTiers: [
      { minQty: 1, priceCentavos: 57500 },
      { minQty: 12, priceCentavos: 54000 },
      { minQty: 24, priceCentavos: 46000 },
      { minQty: 36, priceCentavos: 42000 },
    ],
    youtubeId: null,
    compatibleCrops: [
      { fil: "Palay", en: "Rice" },
      { fil: "Mais", en: "Corn" },
      { fil: "Gulay", en: "Vegetables" },
      { fil: "Mga Puno ng Prutas", en: "Fruit Trees" },
      { fil: "Halamang-ugat", en: "Root Crops" },
    ],
    howToApply: null,
    safetyNotes: {
      fil: "Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.",
      en: "Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.",
    },
  },
  {
    slug: "bio-enzyme",
    name: "Bio Enzyme",
    categorySlug: "crop-care",
    oneLiner: {
      fil: "Enzymatic soil treatment para sa mas mahusay na pagsipsip ng sustansya",
      en: "Enzymatic soil treatment for improved nutrient absorption",
    },
    description: {
      fil: "Ang Bio Enzyme ay isang konsentradong enzymatic formula na ginawa para palakasin ang taba ng lupa at kalusugan ng halaman. Pinabibilis nito ang pagkabulok ng organic na residue sa lupa, kaya nailalabas ang nakakubling sustansya para masipsip ng halaman. Mainam gamitin kasama ng Bio Plant Booster para sa pinakamabuting resulta.",
      en: "Bio Enzyme is a concentrated enzymatic formula designed to enhance soil fertility and plant health. It accelerates the decomposition of organic residues in the soil, releasing locked nutrients for plant uptake. Ideal for use alongside Bio Plant Booster for maximum results.",
    },
    specs: [
      {
        label: { fil: "Uri", en: "Type" },
        value: { fil: "Solid", en: "Solid" },
      },
      {
        label: { fil: "Paggamit", en: "Application" },
        value: { fil: "Pagdidilig sa Lupa", en: "Soil Drench" },
      },
      {
        label: { fil: "Angkop Para Sa", en: "Suitable For" },
        value: { fil: "Palay, Mais, Gulay", en: "Rice, Corn, Vegetables" },
      },
      {
        label: { fil: "Aktibong Sangkap", en: "Active Ingredient" },
        value: { fil: "Natural na enzyme", en: "Natural enzymes" },
      },
    ],
    image: "/images/products/bio-enzyme.webp",
    imageLarge: "/images/products/bio-enzyme-lg.webp",
    priceCentavos: 54800,
    priceTiers: [
      { minQty: 1, priceCentavos: 54800 },
      { minQty: 12, priceCentavos: 52000 },
      { minQty: 24, priceCentavos: 44500 },
      { minQty: 36, priceCentavos: 39800 },
    ],
    youtubeId: null,
    compatibleCrops: [
      { fil: "Palay", en: "Rice" },
      { fil: "Mais", en: "Corn" },
      { fil: "Gulay", en: "Vegetables" },
      { fil: "Mga Puno ng Prutas", en: "Fruit Trees" },
      { fil: "Halamang-ugat", en: "Root Crops" },
    ],
    howToApply: null,
    safetyNotes: {
      fil: "Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.",
      en: "Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.",
    },
  },
  {
    slug: "jasmine-479-rice-seeds",
    name: "Jasmine 479 Rice Seeds",
    categorySlug: "seeds",
    oneLiner: {
      fil: "Premium na mabangong uri ng palay para sa kondisyon ng Pilipinas",
      en: "Premium aromatic rice variety for Philippine growing conditions",
    },
    description: {
      fil: "Ang Jasmine 479 ay isang dekalidad at mabangong uri ng palay na angkop sa klima at lupa ng Pilipinas. Kilala sa mabangong butil at maaasahang ani, ito ay sikat na pinipili ng mga Pilipinong magsasaka ng palay.",
      en: "Jasmine 479 is a high-quality aromatic rice variety suited to Philippine climate and soil conditions. Known for its fragrant grain and reliable yields, it is a popular choice among Filipino rice farmers.",
    },
    specs: [
      {
        label: { fil: "Uri", en: "Variety" },
        value: { fil: "Jasmine 479", en: "Jasmine 479" },
      },
      {
        label: { fil: "Panahon", en: "Season" },
        value: { fil: "Tag-ulan at Tag-araw", en: "Wet & Dry" },
      },
      {
        label: { fil: "Araw Bago Maani", en: "Days to Maturity" },
        value: { fil: "110–120 araw", en: "110–120 days" },
      },
      {
        label: { fil: "Dami ng Binhi", en: "Seed Rate" },
        value: { fil: "40–60 kg/ha", en: "40–60 kg/ha" },
      },
    ],
    image: "/images/products/jasmine-479-rice-seeds.webp",
    imageLarge: "/images/products/jasmine-479-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: {
      fil: "Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.",
      en: "Store in a cool, dry place. Use within the recommended planting season for best germination rates.",
    },
  },
  {
    slug: "mayumi-rice-seeds",
    name: "Mayumi Rice Seeds",
    categorySlug: "seeds",
    oneLiner: {
      fil: "Maaasahang uri ng palay na matibay laban sa sakit",
      en: "Dependable rice variety with strong disease resistance",
    },
    description: {
      fil: "Ang Mayumi ay isang maaasahang uri ng palay na kilala sa tibay laban sa sakit at tuloy-tuloy na maayos na ani sa iba't ibang probinsya ng Pilipinas. Nagbibigay ito ng magandang ani kahit sa hindi gaanong maganda ang kondisyon, kaya praktikal itong pagpipilian ng mga maliliit na magsasaka.",
      en: "Mayumi is a reliable rice variety known for its disease tolerance and consistent performance across Philippine provinces. It produces good yields even under less-than-ideal conditions, making it a practical choice for smallholder farmers.",
    },
    specs: [
      {
        label: { fil: "Uri", en: "Variety" },
        value: { fil: "Mayumi", en: "Mayumi" },
      },
      {
        label: { fil: "Panahon", en: "Season" },
        value: { fil: "Tag-ulan at Tag-araw", en: "Wet & Dry" },
      },
      {
        label: { fil: "Araw Bago Maani", en: "Days to Maturity" },
        value: { fil: "105–115 araw", en: "105–115 days" },
      },
      {
        label: { fil: "Dami ng Binhi", en: "Seed Rate" },
        value: { fil: "40–60 kg/ha", en: "40–60 kg/ha" },
      },
    ],
    image: "/images/products/mayumi-rice-seeds.webp",
    imageLarge: "/images/products/mayumi-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: {
      fil: "Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.",
      en: "Store in a cool, dry place. Use within the recommended planting season for best germination rates.",
    },
  },
];

/** Resolve one localized string to a language. */
function pick(s: LocalizedString, lang: Lang): string {
  return s[lang];
}

/**
 * Resolve a bilingual `ProductSource` to the single-language `Product` shape.
 * Non-prose fields pass through unchanged; every prose field collapses to the
 * requested language.
 */
export function localizeProduct(p: ProductSource, lang: Lang): Product {
  return {
    slug: p.slug,
    name: p.name,
    categorySlug: p.categorySlug,
    oneLiner: pick(p.oneLiner, lang),
    description: pick(p.description, lang),
    specs: p.specs.map((s) => ({
      label: pick(s.label, lang),
      value: pick(s.value, lang),
    })),
    image: p.image,
    imageLarge: p.imageLarge,
    priceCentavos: p.priceCentavos,
    priceTiers: p.priceTiers,
    youtubeId: p.youtubeId,
    compatibleCrops: p.compatibleCrops.map((c) => pick(c, lang)),
    howToApply: p.howToApply ? pick(p.howToApply, lang) : null,
    safetyNotes: p.safetyNotes ? pick(p.safetyNotes, lang) : null,
  };
}

export function getProductBySlug(slug: string): ProductSource | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): ProductSource[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getAllSlugs(): string[] {
  return products.map((p) => p.slug);
}

/** Convenience: all seed products resolved to one language. */
export function getLocalizedProducts(lang: Lang): Product[] {
  return products.map((p) => localizeProduct(p, lang));
}

/** Convenience: one seed product by slug, resolved to one language. */
export function getLocalizedProductBySlug(
  slug: string,
  lang: Lang
): Product | undefined {
  const p = getProductBySlug(slug);
  return p ? localizeProduct(p, lang) : undefined;
}
