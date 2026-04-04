export interface Category {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
}

export const categories: Category[] = [
  {
    slug: "crop-care",
    name: "Crop Care",
    subtitle: "Boosters & Enzymes",
    image: "/images/categories/crop-care.webp",
  },
  {
    slug: "seeds",
    name: "Seeds",
    subtitle: "Rice Varieties",
    image: "/images/categories/seeds.webp",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
