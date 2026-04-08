import { AdminShell } from "@/components/admin-shell";
import { getAdminConfig, type AdminConfig } from "@/lib/admin-store";
import { categories } from "@/data/categories";
import { products as builtInProducts } from "@/data/products";
import { AddProductForm } from "./add-product-form";
import { CustomProductRow } from "./custom-product-row";
import { SeedButton } from "./seed-button";

export default async function AdminProductsPage() {
  let customProducts: AdminConfig["customProducts"] = null;
  let needsSeed = false;

  try {
    const config = await getAdminConfig();
    customProducts = config.customProducts;
    // Check if built-in products haven't been seeded yet
    const customSlugs = new Set(
      (customProducts ?? []).map((p) => p.slug)
    );
    needsSeed = builtInProducts.some((p) => !customSlugs.has(p.slug));
  } catch {
    // Blob not configured yet
    needsSeed = true;
  }

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

      {/* Seed prompt if built-in products haven't been imported */}
      {needsSeed && <SeedButton />}

      {/* Add Product Form */}
      <AddProductForm categories={categories} />

      {/* All products */}
      {customProducts && customProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Products
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
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                    Edit
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                    Visible
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {customProducts.map((product) => (
                  <CustomProductRow key={product.id} product={product} categories={categories} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
