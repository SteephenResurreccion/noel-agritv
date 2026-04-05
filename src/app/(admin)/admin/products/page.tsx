import { AdminShell } from "@/components/admin-shell";
import { products } from "@/data/products";
import { getAdminConfig } from "@/lib/admin-store";
import { getCategoryBySlug } from "@/data/categories";
import { ProductToggle } from "./product-toggle";

export default async function AdminProductsPage() {
  let hiddenProducts: string[] = [];
  try {
    const config = await getAdminConfig();
    hiddenProducts = config.hiddenProducts;
  } catch {
    // Blob not configured yet
  }

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-darkest">Products</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Toggle visibility of products on the storefront.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
