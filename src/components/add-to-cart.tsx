"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { priceForQuantity, type PriceTier } from "@/lib/pricing";
import { formatCentavos } from "@/lib/utils";
import { copy } from "@/lib/copy";
import { TierTable } from "@/components/tier-table";

export interface AddToCartProps {
  slug: string;
  name: string;
  priceCentavos: number;
  image: string;
  /** Volume tiers (ascending by minQty). When present in "detail", drives the reactive price + table. */
  priceTiers?: PriceTier[];
  /** "card" hides the stepper (compact); "detail" shows the stepper + reactive price block + tier table. */
  layout?: "card" | "detail";
}

export function AddToCart({
  slug,
  name,
  priceCentavos,
  image,
  priceTiers,
  layout = "detail",
}: AddToCartProps) {
  const addItem = useCart((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem(
      { slug, name, priceCentavos, image, priceTiers },
      layout === "detail" ? qty : 1
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // Card layout: unchanged compact "Add to cart" — no stepper, no price block.
  if (layout !== "detail") {
    return (
      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-md bg-brand-darkest px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
      >
        {added ? copy.addToCart.added : copy.addToCart.add}
      </button>
    );
  }

  // Detail layout: price reflects the live quantity via the pricing core.
  // qty defaults to 1, so SSR renders the base/tier-1 price (present in static
  // HTML for SEO); the client recomputes as qty changes — no useEffect gate.
  const unitPrice = priceForQuantity({ priceCentavos, priceTiers }, qty) ?? priceCentavos;
  const lineTotal = unitPrice * qty;
  const hasTiers = !!priceTiers && priceTiers.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Price block — big price + unit caption, reflects active tier */}
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <p className="font-heading text-[36px] font-bold leading-none text-text-primary tabular-nums">
          {formatCentavos(unitPrice)}
        </p>
        <p className="text-sm text-text-secondary tabular-nums">
          {copy.addToCart.eachAtQty(qty)}
        </p>
      </div>

      {/* Quantity row */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-[15px] font-semibold text-text-primary">{copy.addToCart.quantity}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={copy.addToCart.decreaseQuantityAriaLabel}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-12 w-12 items-center justify-center rounded-md border-[1.5px] border-brand-mid text-lg text-text-primary"
          >
            −
          </button>
          <span className="w-10 text-center text-lg font-bold text-text-primary tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            aria-label={copy.addToCart.increaseQuantityAriaLabel}
            onClick={() => setQty((q) => Math.min(99, q + 1))}
            className="flex h-12 w-12 items-center justify-center rounded-md border-[1.5px] border-brand-mid text-lg text-text-primary"
          >
            +
          </button>
        </div>
      </div>

      {/* Primary CTA — total reflects active tier × qty */}
      <button
        type="button"
        onClick={handleAdd}
        className="flex min-h-[52px] w-full items-center justify-center whitespace-nowrap rounded-lg bg-brand-accent px-4 text-base font-bold tracking-[0.01em] text-white transition-colors hover:brightness-95"
      >
        {added ? copy.addToCart.added : copy.addToCart.addWithTotal(formatCentavos(lineTotal))}
      </button>

      {/* Wholesale tier table — only when the product has tiers */}
      {hasTiers && (
        <div className="mt-4">
          <h2 className="font-heading text-[19px] font-semibold leading-snug text-text-primary">
            {copy.addToCart.wholesaleHint}
          </h2>
          <p className="mt-0.5 text-sm italic text-brand-accent">{copy.addToCart.tipid}</p>
          <div className="mt-3">
            <TierTable tiers={priceTiers!} activeQty={qty} />
          </div>
          <p className="mt-3 text-[13px] leading-snug text-text-secondary">
            {copy.addToCart.discountAuto}
          </p>
        </div>
      )}
    </div>
  );
}
