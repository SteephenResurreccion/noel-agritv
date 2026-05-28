import type { ShippingConfig } from "@/lib/admin-store";
import { zoneForRegion } from "@/lib/ph-regions";

/**
 * Result of resolving a shipping estimate.
 * - `showFee:false` → render the "confirmed on the call" copy at checkout
 *   (never display ₱0.00 as a fee).
 * - `showFee:true` → render the peso amount as an estimated shipping fee.
 */
export interface ShippingEstimate {
  /** true ⇒ show a peso amount; false ⇒ show "confirmed on the call" copy */
  showFee: boolean;
  /** Integer centavos. 0 when showFee is false. */
  shippingCentavos: number;
}

/**
 * Resolve a shipping estimate for a region under the current config.
 * - shipping disabled            ⇒ { showFee:false, 0 }
 * - region unknown               ⇒ { showFee:false, 0 }
 * - resolved fee is 0 / missing  ⇒ { showFee:false, 0 }  (don't show ₱0.00)
 * - otherwise                    ⇒ { showFee:true, fee }
 */
export function resolveShipping(
  config: ShippingConfig,
  regionValue: string
): ShippingEstimate {
  if (!config.enabled) return { showFee: false, shippingCentavos: 0 };
  const zone = zoneForRegion(regionValue);
  if (!zone) return { showFee: false, shippingCentavos: 0 };
  const fee = config.feesCentavos[zone] ?? 0;
  if (fee <= 0) return { showFee: false, shippingCentavos: 0 };
  return { showFee: true, shippingCentavos: fee };
}
