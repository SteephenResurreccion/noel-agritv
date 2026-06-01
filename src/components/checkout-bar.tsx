"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useHasMounted } from "@/lib/use-has-mounted";
import { formatCentavos } from "@/lib/utils";
import { useCopy } from "@/lib/lang-context";

/**
 * Lazada/Shopee-style sticky checkout bar.
 *
 * Renders nothing during SSR / pre-mount (hydration safety — Zustand persist
 * rehydrates client-side), when the cart is empty, or on cart/checkout/admin
 * routes where the bar would be redundant.
 *
 * Padding to clear the bar from page content is handled at the layout level
 * via a `data-cart-active` attribute toggled here (see (storefront)/layout.tsx
 * + the CSS hook in globals.css). This keeps space reserved only when the bar
 * is actually visible — no wasted bottom padding for empty-cart users.
 */
export function CheckoutBar(): React.ReactElement | null {
  const copy = useCopy();
  const mounted = useHasMounted();
  const count = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotalCentavos());
  const pathname = usePathname();

  const hiddenByRoute =
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/admin/") ||
    pathname === "/admin";

  const visible = mounted && count > 0 && !hiddenByRoute;

  // Toggle a body data-attribute so the layout can reserve bottom padding
  // only when the bar is actually rendered. CSS-only, no layout shift on
  // every cart change beyond the attribute flip.
  useEffect(() => {
    if (!mounted) return;
    if (visible) {
      document.body.setAttribute("data-cart-active", "true");
    } else {
      document.body.removeAttribute("data-cart-active");
    }
    return () => {
      document.body.removeAttribute("data-cart-active");
    };
  }, [mounted, visible]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={copy.checkoutBar.summaryAria}
      className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-surface shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:bottom-0"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-screen-md items-center justify-between gap-4 px-4 pt-3">
        <div className="flex items-center gap-2 text-text-primary">
          <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="text-sm font-semibold sm:text-base">
            {copy.checkoutBar.count(count)}
          </span>
          <span aria-hidden="true" className="text-text-secondary">
            ·
          </span>
          <span className="text-sm font-semibold sm:text-base">
            {formatCentavos(subtotal)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="rounded-md bg-brand-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent sm:text-base"
        >
          {copy.checkoutBar.checkout}
        </Link>
      </div>
    </div>
  );
}
