import { auth } from "@/auth";
import Link from "next/link";
import { Package, Video } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { products } from "@/data/products";
import { getAdminConfig } from "@/lib/admin-store";

export default async function AdminDashboardPage() {
  const session = await auth();

  let visibleProducts = products.length;
  let videoCount = 0;
  try {
    const config = await getAdminConfig();
    visibleProducts = products.length - config.hiddenProducts.length;
    videoCount = config.videos?.filter((v) => v.visible).length ?? 0;
  } catch {
    // Blob not configured yet — show defaults
    visibleProducts = products.length;
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-brand-darkest">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Welcome back, {session?.user?.name?.split(" ")[0] ?? "Admin"}.
      </p>

      <div className="mt-8 grid gap-4 min-[741px]:grid-cols-2">
        <Link
          href="/admin/products"
          className="group rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10">
              <Package className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Products
              </p>
              <p className="text-2xl font-bold text-brand-darkest">
                {visibleProducts}
                <span className="text-sm font-normal text-text-secondary">
                  {" "}
                  / {products.length} visible
                </span>
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Toggle which products appear on the storefront.
          </p>
        </Link>

        <Link
          href="/admin/videos"
          className="group rounded-lg border border-border bg-surface p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent/10">
              <Video className="h-5 w-5 text-brand-accent" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                Videos
              </p>
              <p className="text-2xl font-bold text-brand-darkest">
                {videoCount || "—"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-secondary">
            Manage the video reel on the homepage.
          </p>
        </Link>
      </div>
    </AdminShell>
  );
}
