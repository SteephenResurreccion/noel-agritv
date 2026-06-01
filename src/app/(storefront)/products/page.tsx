import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocalizedProducts, type Product } from "@/data/products";
import { ProductCard } from "@/components/product-card";
import { CategoryFilter } from "@/components/category-filter";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export const revalidate = 30; // ISR: revalidate every 30s instead of force-dynamic

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getCopy(await getLangFromRequest());
  return {
    title: meta.productsTitle,
    description: meta.productsDescription,
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const lang = await getLangFromRequest();
  const copy = getCopy(lang);
  const params = await searchParams;
  const category = params.category;

  const localizedProducts = getLocalizedProducts(lang);
  let allProducts: Product[] = localizedProducts;

  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map(adminToProduct);

    if (custom.length > 0) {
      // Custom products exist (seeded or admin-created) — use them as source of truth
      allProducts = custom;
    } else {
      // Fallback to built-in products (before admin seeds them)
      allProducts = localizedProducts.filter(
        (p) => !config.hiddenProducts.includes(p.slug)
      );
    }
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
          {copy.productList.title}
        </h1>
        <div className="mb-6">
          <Suspense>
            <CategoryFilter />
          </Suspense>
        </div>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-text-secondary">
            {copy.productList.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-[var(--spacing-grid-gap)] min-[375px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1200px]:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.slug}
                product={product}
                wholesaleLabel={copy.productCard.wholesaleAvailable}
                messengerLabel={copy.common.messenger}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
