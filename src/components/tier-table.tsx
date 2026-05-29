import { type PriceTier } from "@/lib/pricing";
import { cn, formatCentavos } from "@/lib/utils";

export interface TierTableProps {
  tiers: PriceTier[];
  /** Live quantity; the row whose range contains it is highlighted. */
  activeQty: number;
}

/**
 * Index of the active tier: the highest tier whose `minQty <= activeQty`
 * (matching `priceForQuantity`'s selection rule exactly). Defaults to the
 * first tier when qty is below every break. Matching by index — not by
 * resolved price — avoids highlighting two rows if tiers ever share a price.
 */
function activeTierIndex(tiers: PriceTier[], activeQty: number): number {
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (activeQty >= tiers[i].minQty) idx = i;
  }
  return idx;
}

/**
 * Presentational wholesale tier table (no internal state). The active row is the
 * tier `priceForQuantity` selects for `activeQty`, so the highlight always
 * matches the price the buyer actually pays.
 *
 * Range label per row i: `${minQty}–${nextMinQty - 1}` (en-dash, U+2013);
 * the last tier renders `${minQty}+`.
 */
export function TierTable({ tiers, activeQty }: TierTableProps) {
  const activeIdx = activeTierIndex(tiers, activeQty);

  return (
    <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-[10px] border border-border bg-surface tabular-nums">
      <thead>
        <tr className="bg-brand-dark">
          <th
            scope="col"
            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-white/92"
          >
            Quantity
          </th>
          <th
            scope="col"
            className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.06em] text-white/92"
          >
            Price each
          </th>
        </tr>
      </thead>
      <tbody>
        {tiers.map((tier, i) => {
          const isLast = i === tiers.length - 1;
          const range = isLast
            ? `${tier.minQty}+`
            : `${tier.minQty}–${tiers[i + 1].minQty - 1}`;
          const isActive = i === activeIdx;

          return (
            <tr
              key={tier.minQty}
              data-testid={`tier-row-${tier.minQty}`}
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "true" : undefined}
              className={cn(
                !isLast && "border-b border-border",
                isActive && "bg-bg-wheat"
              )}
            >
              <td
                className={cn(
                  "border-l-4 px-4 py-4 text-left text-base text-text-primary",
                  isActive
                    ? "border-brand-accent font-bold"
                    : "border-transparent font-medium"
                )}
              >
                {range}
              </td>
              <td
                className={cn(
                  "px-4 py-4 text-right text-[17px] font-bold",
                  isActive ? "text-brand-accent" : "text-text-primary"
                )}
              >
                {formatCentavos(tier.priceCentavos)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
