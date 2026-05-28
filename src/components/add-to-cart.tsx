"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";

export interface AddToCartProps {
  slug: string;
  name: string;
  priceCentavos: number;
  image: string;
  /** "card" hides the stepper (compact); "detail" shows the stepper. */
  layout?: "card" | "detail";
}

export function AddToCart({
  slug,
  name,
  priceCentavos,
  image,
  layout = "detail",
}: AddToCartProps) {
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ slug, name, priceCentavos, image }, layout === "detail" ? qty : 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {layout === "detail" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-primary"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-text-primary"
          >
            +
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-md bg-brand-darkest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        {added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
