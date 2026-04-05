import type { Product } from "@/data/products";
import type { AdminProduct } from "@/lib/admin-store";

/** Convert an admin-created product to a full Product object for storefront rendering */
export function adminToProduct(p: AdminProduct): Product {
  return {
    slug: p.slug,
    name: p.name,
    categorySlug: p.categorySlug,
    oneLiner: p.description.length > 100 ? p.description.slice(0, 100) + "..." : p.description,
    description: p.description,
    specs: p.specs ?? [],
    variants: [{ packSize: "", price: 0 }],
    image: p.image,
    imageLarge: p.image,
    youtubeId: null,
    compatibleCrops: p.compatibleCrops ?? [],
    howToApply: p.howToApply ?? null,
    safetyNotes: p.safetyNotes ?? null,
  };
}
