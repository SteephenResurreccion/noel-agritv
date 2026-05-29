import type { ShippingConfig } from "@/lib/admin-store";
import { zoneForRegion } from "@/lib/ph-regions";
import { FREE_SHIPPING_MIN_UNITS } from "@/lib/pricing";

// Re-export so consumers/tests can pull the threshold from "@/lib/shipping".
export { FREE_SHIPPING_MIN_UNITS };

/**
 * Result of resolving a shipping estimate.
 * - `free:true` → shipping is waived (₱0); render "FREE". Overrides any region fee.
 * - `showFee:false` (and not free) → render the "confirmed on the call" copy at
 *   checkout (never display ₱0.00 as a fee).
 * - `showFee:true` → render the peso amount as an estimated shipping fee.
 */
export interface ShippingEstimate {
  /** true ⇒ show a peso amount; false ⇒ show "confirmed on the call" copy */
  showFee: boolean;
  /** Integer centavos. 0 when showFee is false. */
  shippingCentavos: number;
  /** true ⇒ shipping waived (≥ FREE_SHIPPING_MIN_UNITS total units); render "FREE". */
  free: boolean;
}

/**
 * Resolve a shipping estimate for a region under the current config.
 * - totalUnits ≥ FREE_SHIPPING_MIN_UNITS ⇒ { showFee:false, 0, free:true }  (overrides region fee)
 * - shipping disabled            ⇒ { showFee:false, 0, free:false }
 * - region unknown               ⇒ { showFee:false, 0, free:false }
 * - resolved fee is 0 / missing  ⇒ { showFee:false, 0, free:false }  (don't show ₱0.00)
 * - otherwise                    ⇒ { showFee:true, fee, free:false }
 *
 * `totalUnits` is evaluated server-side (never trusted from the client). When
 * omitted (legacy 2-arg call), the free-shipping branch is skipped.
 */
export function resolveShipping(
  config: ShippingConfig,
  regionValue: string,
  totalUnits?: number
): ShippingEstimate {
  // Free-shipping threshold takes priority over any region fee.
  if (totalUnits !== undefined && totalUnits >= FREE_SHIPPING_MIN_UNITS) {
    return { showFee: false, shippingCentavos: 0, free: true };
  }
  if (!config.enabled) return { showFee: false, shippingCentavos: 0, free: false };
  const zone = zoneForRegion(regionValue);
  if (!zone) return { showFee: false, shippingCentavos: 0, free: false };
  const fee = config.feesCentavos[zone] ?? 0;
  if (fee <= 0) return { showFee: false, shippingCentavos: 0, free: false };
  return { showFee: true, shippingCentavos: fee, free: false };
}
