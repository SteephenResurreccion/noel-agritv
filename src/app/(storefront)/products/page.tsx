import type { Metadata } from "next";
import { Suspense } from "react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";

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
  const filtered = category
    ? products.filter((p) => p.categorySlug === category)
    : products;

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
