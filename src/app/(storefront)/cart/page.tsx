"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCentavos } from "@/lib/utils";

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart((s) => s.subtotalCentavos());

  if (items.length === 0) {
    return (
      <div className="container-site py-[var(--spacing-section)] text-center">
        <h1 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
          Your cart is empty
        </h1>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-brand-darkest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="mb-6 text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        Your Cart
      </h1>
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.slug} className="flex items-center gap-4 border-b border-border pb-4">
            <img src={i.image} alt={i.name} className="h-16 w-16 rounded-md object-cover" />
            <div className="flex-1">
              <p className="font-semibold text-text-primary">{i.name}</p>
              <p className="text-sm text-text-secondary">{formatCentavos(i.priceCentavos)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty(i.slug, i.qty - 1)}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-primary"
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{i.qty}</span>
              <button
                onClick={() => setQty(i.slug, i.qty + 1)}
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-text-primary"
              >
                +
              </button>
            </div>
            <button
              onClick={() => removeItem(i.slug)}
              aria-label={`Remove ${i.name}`}
              className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between">
        <span className="text-base font-semibold text-text-primary">Subtotal</span>
        <span className="text-lg font-bold text-brand-darkest">{formatCentavos(subtotal)}</span>
      </div>
      <Link
        href="/checkout"
        className="mt-4 block rounded-md bg-brand-darkest px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
