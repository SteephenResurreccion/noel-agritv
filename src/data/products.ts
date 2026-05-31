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
  priceCentavos?: number; // integer centavos; undefined/absent ⇒ inquiry-only (no Add-to-cart)
  priceTiers?: import("@/lib/pricing").PriceTier[]; // ascending by minQty; first minQty = 1
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
    oneLiner: "Bio-fertilizer foliar at soil conditioner para sa mas malusog na pananim",
    description:
      "Ang Bio Plant Booster ay isang bio-fertilizer growth enhancer na ginawa para pagandahin ang kalusugan ng lupa at pasiglahin ang paglaki ng halaman. Naglalaman ito ng kapaki-pakinabang na mikroorganismo na tumutulong masira ang organic matter, para mas makuha ng halaman ang sustansya. Ang regular na paggamit ay nagpapatibay ng ugat, nagpapaganda ng pagsipsip ng sustansya, at nagpapataas ng ani.",
    specs: [
      { label: "Uri", value: "Likido" },
      { label: "Paggamit", value: "Foliar / Pagdidilig sa Lupa" },
      { label: "Angkop Para Sa", value: "Palay, Mais, Gulay" },
      { label: "Aktibong Sangkap", value: "Bio-fertilizer na mikroorganismo" },
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
    compatibleCrops: ["Palay", "Mais", "Gulay", "Mga Puno ng Prutas", "Halamang-ugat"],
    howToApply: null,
    safetyNotes: "Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.",
  },
  {
    slug: "bio-enzyme",
    name: "Bio Enzyme",
    categorySlug: "crop-care",
    oneLiner: "Enzymatic soil treatment para sa mas mahusay na pagsipsip ng sustansya",
    description:
      "Ang Bio Enzyme ay isang konsentradong enzymatic formula na ginawa para palakasin ang taba ng lupa at kalusugan ng halaman. Pinabibilis nito ang pagkabulok ng organic na residue sa lupa, kaya nailalabas ang nakakubling sustansya para masipsip ng halaman. Mainam gamitin kasama ng Bio Plant Booster para sa pinakamabuting resulta.",
    specs: [
      { label: "Uri", value: "Solid" },
      { label: "Paggamit", value: "Pagdidilig sa Lupa" },
      { label: "Angkop Para Sa", value: "Palay, Mais, Gulay" },
      { label: "Aktibong Sangkap", value: "Natural na enzyme" },
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
    compatibleCrops: ["Palay", "Mais", "Gulay", "Mga Puno ng Prutas", "Halamang-ugat"],
    howToApply: null,
    safetyNotes: "Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.",
  },
  {
    slug: "jasmine-479-rice-seeds",
    name: "Jasmine 479 Rice Seeds",
    categorySlug: "seeds",
    oneLiner: "Premium na mabangong uri ng palay para sa kondisyon ng Pilipinas",
    description:
      "Ang Jasmine 479 ay isang dekalidad at mabangong uri ng palay na angkop sa klima at lupa ng Pilipinas. Kilala sa mabangong butil at maaasahang ani, ito ay sikat na pinipili ng mga Pilipinong magsasaka ng palay.",
    specs: [
      { label: "Uri", value: "Jasmine 479" },
      { label: "Panahon", value: "Tag-ulan at Tag-araw" },
      { label: "Araw Bago Maani", value: "110–120 araw" },
      { label: "Dami ng Binhi", value: "40–60 kg/ha" },
    ],
    image: "/images/products/jasmine-479-rice-seeds.webp",
    imageLarge: "/images/products/jasmine-479-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: "Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.",
  },
  {
    slug: "mayumi-rice-seeds",
    name: "Mayumi Rice Seeds",
    categorySlug: "seeds",
    oneLiner: "Maaasahang uri ng palay na matibay laban sa sakit",
    description:
      "Ang Mayumi ay isang maaasahang uri ng palay na kilala sa tibay laban sa sakit at tuloy-tuloy na maayos na ani sa iba't ibang probinsya ng Pilipinas. Nagbibigay ito ng magandang ani kahit sa hindi gaanong maganda ang kondisyon, kaya praktikal itong pagpipilian ng mga maliliit na magsasaka.",
    specs: [
      { label: "Uri", value: "Mayumi" },
      { label: "Panahon", value: "Tag-ulan at Tag-araw" },
      { label: "Araw Bago Maani", value: "105–115 araw" },
      { label: "Dami ng Binhi", value: "40–60 kg/ha" },
    ],
    image: "/images/products/mayumi-rice-seeds.webp",
    imageLarge: "/images/products/mayumi-rice-seeds-lg.webp",
    youtubeId: null,
    compatibleCrops: [],
    howToApply: null,
    safetyNotes: "Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.",
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
