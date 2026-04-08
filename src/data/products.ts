export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  oneLiner: string;
  description: string;
  specs: ProductSpec[];
  image: string;
  imageLarge: string;
  youtubeId: string | null;
  compatibleCrops: string[];
  howToApply: string | null;
  safetyNotes: string | null;
}

export const products: Product[] = [
  {
    slug: "bio-plant-booster",
    name: "Bio Plant Booster",
    categorySlug: "crop-care",
    oneLiner: "Bio-fertilizer foliar and soil conditioner for healthier crops",
    description:
      "Bio Plant Booster is a bio-fertilizer growth enhancer formulated to improve soil health and stimulate plant growth. It contains beneficial microorganisms that help break down organic matter, making nutrients more available to plants. Regular application promotes stronger root development, better nutrient uptake, and improved crop yields.",
    specs: [
      { label: "Type", value: "Liquid" },
      { label: "Application", value: "Foliar / Soil Drench" },
      { label: "Suitable For", value: "Rice, Corn, Vegetables" },
      { label: "Active Ingredient", value: "Bio-fertilizer microorganisms" },
    ],
    image: "/images/products/bio-plant-booster.webp",
    imageLarge: "/images/products/bio-plant-booster-lg.webp",
    youtubeId: null,
    compatibleCrops: ["Rice", "Corn", "Vegetables", "Fruit Trees", "Root Crops"],
    howToApply: null,
    safetyNotes: "Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.",
  },
  {
    slug: "bio-enzyme",
    name: "Bio Enzyme",
    categorySlug: "crop-care",
    oneLiner: "Enzymatic soil treatment for improved nutrient absorption",
    description:
      "Bio Enzyme is a concentrated enzymatic formula designed to enhance soil fertility and plant health. It accelerates the decomposition of organic residues in the soil, releasing locked nutrients for plant uptake. Ideal for use alongside Bio Plant Booster for maximum results.",
    specs: [
      { label: "Type", value: "Solid" },
      { label: "Application", value: "Soil Drench" },
      { label: "Suitable For", value: "Rice, Corn, Vegetables" },
      { label: "Active Ingredient", value: "Natural enzymes" },
    ],
    image: "/images/products/bio-enzyme.webp",
    imageLarge: "/images/products/bio-enzyme-lg.webp",
    youtubeId: null,
    compatibleCrops: ["Rice", "Corn", "Vegetables", "Fruit Trees", "Root Crops"],
    howToApply: null,
    safetyNotes: "Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.",
  },
  {
    slug: "jasmine-479-rice-seeds",
    name: "Jasmine 479 Rice Seeds",
    categorySlug: "seeds",
    oneLiner: "Premium aromatic rice variety for Philippine growing conditions",
    description:
      "Jasmine 479 is a high-quality aromatic rice variety suited to Philippine climate and soil conditions. Known for its fragrant grain and reliable yields, it is a popular choice among Filipino rice farmers.",
    specs: [
      { label: "Variety", value: "Jasmine 479" },
      { label: "Season", value: "Wet & Dry" },
      { label: "Days to Maturity", value: "110–120 days" },
      { label: "Seed Rate", value: "40–60 kg/ha" },
    ],
    image: "/images/products/jasmine-479-rice-seeds.webp",
    imageLarge: "/images/products/jasmine-479-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: "Store in a cool, dry place. Use within the recommended planting season for best germination rates.",
  },
  {
    slug: "mayumi-rice-seeds",
    name: "Mayumi Rice Seeds",
    categorySlug: "seeds",
    oneLiner: "Dependable rice variety with strong disease resistance",
    description:
      "Mayumi is a reliable rice variety known for its disease tolerance and consistent performance across Philippine provinces. It produces good yields even under less-than-ideal conditions, making it a practical choice for smallholder farmers.",
    specs: [
      { label: "Variety", value: "Mayumi" },
      { label: "Season", value: "Wet & Dry" },
      { label: "Days to Maturity", value: "105–115 days" },
      { label: "Seed Rate", value: "40–60 kg/ha" },
    ],
    image: "/images/products/mayumi-rice-seeds.webp",
    imageLarge: "/images/products/mayumi-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: "Store in a cool, dry place. Use within the recommended planting season for best germination rates.",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getAllSlugs(): string[] {
  return products.map((p) => p.slug);
}
