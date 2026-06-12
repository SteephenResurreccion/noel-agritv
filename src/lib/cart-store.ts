import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { priceForQuantity } from "@/lib/pricing";

/**
 * A single cart line. Hand-written (NOT `z.infer`) so the zod vendor chunk stays
 * OUT of the storefront client bundle — this module is pulled into
 * `(storefront)/layout` first-load on every route via the `"use client"`
 * CheckoutBar / cart-badge. The matching Zod schema (`cartItemSchema`,
 * src/lib/cart-schema.ts, server-only) carries a compile-time `Equals` assertion
 * against this interface so the two shapes cannot drift.
 *
 * Persisted carts are NOT zod-validated on the client today — Zustand `persist`
 * rehydrates raw JSON — so keeping the schema server-side loses no client
 * validation. The server re-validates the cart in `submitOrder` before pricing.
 */
export interface CartItem {
  slug: string;
  name: string;
  priceCentavos: number;
  priceTiers?: { minQty: number; priceCentavos: number }[];
  qty: number;
  image: string;
}

/** Per-line unit price honoring volume tiers (falls back to flat priceCentavos). */
export function lineUnitPriceCentavos(item: CartItem): number {
  return priceForQuantity(item, item.qty) ?? item.priceCentavos;
}

/** Pure helper — total of all line items in centavos. */
export function computeSubtotalCentavos(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineUnitPriceCentavos(i) * i.qty, 0);
}

const clampQty = (q: number) => Math.max(1, Math.min(99, Math.trunc(q)));

export interface CartState {
  items: CartItem[];
  /** Add an item; if slug exists, increment qty (capped at 99). */
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  /** Set absolute qty for a slug; qty<=0 removes the line. */
  setQty: (slug: string, qty: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  totalItems: () => number; // sum of qty across lines
  subtotalCentavos: () => number; // = computeSubtotalCentavos(items)
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.slug === item.slug);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.slug === item.slug ? { ...i, qty: clampQty(i.qty + qty) } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty: clampQty(qty) }] };
        }),
      setQty: (slug, qty) =>
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.slug !== slug) };
          }
          return {
            items: state.items.map((i) =>
              i.slug === slug ? { ...i, qty: clampQty(qty) } : i
            ),
          };
        }),
      removeItem: (slug) =>
        set((state) => ({ items: state.items.filter((i) => i.slug !== slug) })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotalCentavos: () => computeSubtotalCentavos(get().items),
    }),
    {
      name: "noel-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
