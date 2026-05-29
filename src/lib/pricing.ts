/**
 * Pure volume-pricing math. The single source of truth for tier prices,
 * shared by the cart store (display) and submitOrder (server authority).
 * Money is integer centavos throughout.
 */

export interface PriceTier {
  /** Minimum quantity (of THIS product) at which this per-item price applies. */
  minQty: number;
  /** Per-item price in integer centavos at this tier. */
  priceCentavos: number;
}

/** Minimal structural shape both `Product` and a cart line satisfy. */
export interface TieredPricing {
  priceCentavos?: number;
  priceTiers?: PriceTier[];
}

/** Total cart units at/above which shipping is free (spec §6). */
export const FREE_SHIPPING_MIN_UNITS = 4;

/**
 * Per-item price for a given quantity: the priceCentavos of the highest tier
 * whose minQty <= qty. Falls back to base priceCentavos when there are no tiers.
 * Returns undefined only for inquiry-only items (no base price, no tiers).
 * Tiers are assumed sorted ascending by minQty (enforced by data + admin validation).
 */
export function priceForQuantity(product: TieredPricing, qty: number): number | undefined {
  const tiers = product.priceTiers;
  if (!tiers || tiers.length === 0) return product.priceCentavos;
  let price = product.priceCentavos;
  for (const tier of tiers) {
    if (qty >= tier.minQty) price = tier.priceCentavos;
  }
  return price;
}

/**
 * The nearest cheaper tier ahead of the current quantity, for the cart's
 * "Add N more -> P each" nudge. Null when none (no tiers, or already top tier).
 */
export function nextTierInfo(
  product: TieredPricing,
  qty: number,
): { unitsToNext: number; nextPriceCentavos: number } | null {
  const tiers = product.priceTiers;
  if (!tiers || tiers.length === 0) return null;
  const current = priceForQuantity(product, qty) ?? Infinity;
  for (const tier of tiers) {
    if (tier.minQty > qty && tier.priceCentavos < current) {
      return { unitsToNext: tier.minQty - qty, nextPriceCentavos: tier.priceCentavos };
    }
  }
  return null;
}
