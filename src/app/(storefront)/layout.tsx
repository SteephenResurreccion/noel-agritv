import { AnnouncementBar } from "@/components/announcement-bar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";
import { CheckoutBar } from "@/components/checkout-bar";
import { products } from "@/data/products";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let allProducts = products;
  try {
    const config = await getAdminConfig();
    const custom = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map(adminToProduct);
    if (custom.length > 0) allProducts = custom;
  } catch {
    // fallback to built-in
  }

  // Slim down for client — only what search needs
  const searchProducts = allProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    oneLiner: p.oneLiner,
    image: p.image,
  }));

  return (
    <>
      <AnnouncementBar />
      <Header searchProducts={searchProducts} />
      {/*
        Bottom padding strategy:
        - Base `pb-16` reserves space for the mobile-bottom-bar (md and below).
        - `body[data-cart-active="true"]` toggles extra clearance for the
          CheckoutBar (~80px) when the cart has items + we're not on a hidden
          route. This keeps the empty-cart UX flush — no wasted whitespace.
        - Hook lives in globals.css.
      */}
      <main className="min-h-screen pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomBar />
      <CheckoutBar />
    </>
  );
}
