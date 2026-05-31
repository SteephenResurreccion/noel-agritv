"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  useCart,
  lineUnitPriceCentavos,
  type CartItem,
} from "@/lib/cart-store";
import { nextTierInfo, FREE_SHIPPING_MIN_UNITS } from "@/lib/pricing";
import { formatCentavos } from "@/lib/utils";
import { copy } from "@/lib/copy";

/**
 * Per-line "buy a little more, save more" nudge. Renders ONLY when the line is
 * 1–2 units short of the next cheaper tier (`nextTierInfo` already filters to
 * the nearest cheaper break ahead). One nudge per line — never stacked.
 * Arrow glyph is muted (ink .38); the target price is gold + bold.
 */
function CartLineNudge({ item }: { item: CartItem }) {
  const next = nextTierInfo(item, item.qty);
  if (!next || next.unitsToNext > 2) return null;
  return (
    <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-text-primary">
      {copy.cart.nudge(next.unitsToNext)}{" "}
      <span className="text-text-disabled">→</span>{" "}
      <span className="font-bold text-brand-accent">
        {copy.cart.nudgeEach(formatCentavos(next.nextPriceCentavos))}
      </span>
    </p>
  );
}

/**
 * Single free-shipping status line near the subtotal. Renders EXACTLY ONE
 * state (the two-state mock was a review aid). Free at FREE_SHIPPING_MIN_UNITS
 * total units; below that, shows how many more items are needed. Text only —
 * no progress bar. The server remains authoritative for the actual waiver.
 */
function FreeShippingLine({ totalUnits }: { totalUnits: number }) {
  if (totalUnits >= FREE_SHIPPING_MIN_UNITS) {
    return (
      <p aria-live="polite" className="mt-2 text-sm font-bold text-brand-mid">
        <span aria-hidden="true">✓</span> {copy.cart.freeUnlocked}
      </p>
    );
  }
  const remaining = FREE_SHIPPING_MIN_UNITS - totalUnits;
  return (
    <p aria-live="polite" className="mt-2 text-sm font-medium text-text-primary">
      {copy.cart.freeShippingPrompt(remaining)}
    </p>
  );
}

export default function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const removeItem = useCart((s) => s.removeItem);
  const subtotal = useCart((s) => s.subtotalCentavos());
  const totalUnits = useCart((s) => s.totalItems());

  if (items.length === 0) {
    return (
      <div className="container-site py-[var(--spacing-section)] text-center">
        <h1 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
          {copy.cart.empty}
        </h1>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-brand-darkest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          {copy.cart.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-site py-[var(--spacing-section)]">
      <h1 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
        {copy.cart.title}
      </h1>
      <p className="mb-6 mt-1 text-sm text-text-secondary">
        {copy.cart.itemCount(totalUnits)}
      </p>
      <ul className="space-y-4">
        {items.map((i) => {
          const unit = lineUnitPriceCentavos(i);
          const lineTotal = unit * i.qty;
          return (
            <li
              key={i.slug}
              className="rounded-[10px] border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={i.image}
                  alt={i.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-heading font-semibold text-text-primary">
                    {i.name}
                  </p>
                  <p className="text-sm tabular-nums text-text-secondary">
                    {copy.cart.eachPrice(formatCentavos(unit))}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(i.slug)}
                  aria-label={copy.cart.removeAria(i.name)}
                  className="flex h-12 w-12 items-center justify-center rounded-md text-text-secondary hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(i.slug, i.qty - 1)}
                    aria-label={copy.addToCart.decreaseQuantityAriaLabel}
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-border text-text-primary"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {i.qty}
                  </span>
                  <button
                    onClick={() => setQty(i.slug, i.qty + 1)}
                    aria-label={copy.addToCart.increaseQuantityAriaLabel}
                    className="flex h-12 w-12 items-center justify-center rounded-md border border-border text-text-primary"
                  >
                    +
                  </button>
                </div>
                <span className="text-lg font-bold tabular-nums text-text-primary">
                  {formatCentavos(lineTotal)}
                </span>
              </div>
              <CartLineNudge item={i} />
            </li>
          );
        })}
      </ul>
      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-base font-semibold text-text-primary">
          {copy.cart.subtotal}
        </span>
        <span className="text-lg font-bold tabular-nums text-brand-darkest">
          {formatCentavos(subtotal)}
        </span>
      </div>
      <FreeShippingLine totalUnits={totalUnits} />
      <Link
        href="/checkout"
        className="mt-4 block rounded-md bg-brand-darkest px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark"
      >
        {copy.cart.checkoutWithSubtotal(formatCentavos(subtotal))}
      </Link>
    </div>
  );
}
