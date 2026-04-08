import { AdminShell } from "@/components/admin-shell";
import { getAdminConfig, type AdminConfig } from "@/lib/admin-store";
import { categories } from "@/data/categories";
import { products as builtInProducts } from "@/data/products";
import { AddProductForm } from "./add-product-form";
import { CustomProductRow } from "./custom-product-row";
import { FeaturedProductList } from "./featured-product-row";
import { SeedButton } from "./seed-button";

export default async function AdminProductsPage() {
  let customProducts: AdminConfig["customProducts"] = null;
  let featuredProductIds: string[] = [];
  let needsSeed = false;

  try {
    const config = await getAdminConfig();
    customProducts = config.customProducts;
    featuredProductIds = config.featuredProductIds ?? [];
    const customSlugs = new Set(
      (customProducts ?? []).map((p) => p.slug)
    );
    needsSeed = builtInProducts.some((p) => !customSlugs.has(p.slug));
  } catch {
    needsSeed = true;
  }

  // Build featured products list in order
  const allProducts = customProducts ?? [];
  const featuredProducts = featuredProductIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as NonNullable<AdminConfig["customProducts"]>;

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-darkest">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your products — edit, toggle visibility, or add new ones.
          </p>
        </div>
      </div>

      {needsSeed && <SeedButton />}

      <AddProductForm categories={categories} />

      {/* Featured / Top Picks */}
      {featuredProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Homepage Top Picks
          </h2>
          <FeaturedProductList products={featuredProducts} />
        </div>
      )}

      {/* All products */}
      {allProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
            All Products
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th className="px-4 py-3 font-semibold text-text-secondary">
                    Product
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-text-secondary md:table-cell">
                    Category
                  </th>
                  <th className="w-16 px-2 py-3 text-center font-semibold text-text-secondary">
                    Featured
                  </th>
                  <th className="w-16 px-2 py-3 text-center font-semibold text-text-secondary">
                    Edit
                  </th>
                  <th className="w-20 px-2 py-3 text-center font-semibold text-text-secondary">
                    Visible
                  </th>
                  <th className="w-16 px-2 py-3 text-center font-semibold text-text-secondary">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((product) => (
                  <CustomProductRow
                    key={product.id}
                    product={product}
                    categories={categories}
                    isFeatured={featuredProductIds.includes(product.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
