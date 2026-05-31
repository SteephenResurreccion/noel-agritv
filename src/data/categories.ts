export interface Category {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
}

export const categories: Category[] = [
  {
    slug: "crop-care",
    name: "Pangalaga sa Pananim",
    subtitle: "Mga Booster at Enzyme",
    image: "/images/categories/crop-care.webp",
  },
  {
    slug: "seeds",
    name: "Mga Binhi",
    subtitle: "Mga Uri ng Palay",
    image: "/images/categories/seeds.webp",
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
