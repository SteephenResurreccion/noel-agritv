import { AdminShell } from "@/components/admin-shell";
import { products } from "@/data/products";
import { getAdminConfig, type AdminConfig } from "@/lib/admin-store";
import { getCategoryBySlug, categories } from "@/data/categories";
import { ProductToggle } from "./product-toggle";
import { AddProductForm } from "./add-product-form";
import { CustomProductRow } from "./custom-product-row";

export default async function AdminProductsPage() {
  let hiddenProducts: string[] = [];
  let customProducts: AdminConfig["customProducts"] = null;

  try {
    const config = await getAdminConfig();
    hiddenProducts = config.hiddenProducts;
    customProducts = config.customProducts;
  } catch {
    // Blob not configured yet
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-darkest">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Toggle visibility or add new products to the storefront.
          </p>
        </div>
      </div>

      {/* Add Product Form */}
      <AddProductForm categories={categories} />

      {/* Custom products (admin-created) */}
      {customProducts && customProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Custom Products
          </h2>
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
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
                    Visible
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {customProducts.map((product) => (
                  <CustomProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Built-in products */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-text-secondary">
          Built-in Products
        </h2>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
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
                  Visible
                </th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const category = getCategoryBySlug(product.categorySlug);
                const isVisible = !hiddenProducts.includes(product.slug);

                return (
                  <tr
                    key={product.slug}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-text-primary">
                        {product.name}
                      </p>
                      <p className="text-xs text-text-secondary md:hidden">
                        {category?.name}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary md:table-cell">
                      {category?.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductToggle slug={product.slug} visible={isVisible} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-text-secondary/40">
                      —
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
