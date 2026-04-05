import type { Metadata } from "next";
import { Suspense } from "react";
import { products, type Product } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import { getAdminConfig } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Products",
  description:
    "Browse Noel AgriTV's bio-organic crop care products and quality rice seeds. Message us to order.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category;

  let allProducts: Product[] = products;

  try {
    const config = await getAdminConfig();
    const builtIn = products.filter(
      (p) => !config.hiddenProducts.includes(p.slug)
    );
    const custom: Product[] = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        categorySlug: p.categorySlug,
        oneLiner: p.description,
        description: p.description,
        specs: [],
        variants: [{ packSize: "", price: 0 }],
        image: p.image,
        imageLarge: p.image,
        youtubeId: null,
        compatibleCrops: [],
        howToApply: null,
        safetyNotes: null,
      }));
    allProducts = [...builtIn, ...custom];
  } catch {
    // Blob not configured — use defaults
  }

  const filtered = category
    ? allProducts.filter((p) => p.categorySlug === category)
    : allProducts;

  return (
    <div className="bg-bg py-[var(--spacing-section)]">
      <div className="container-site">
        <h1 className="mb-6 text-center text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
          All Products
        </h1>
        <div className="mb-6">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
        <div className="grid grid-cols-1 gap-[var(--spacing-grid-gap)] min-[375px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1200px]:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
