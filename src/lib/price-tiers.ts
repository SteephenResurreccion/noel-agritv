import { z } from "zod";

/** Validates a per-product volume tier ladder: ascending minQty, first tier starts at 1, positive centavos. Empty = no tiers. */
export const priceTierSchema = z
  .array(z.object({ minQty: z.number().int().positive(), priceCentavos: z.number().int().positive() }))
  .refine((t) => t.length === 0 || t[0].minQty === 1, { message: "First tier must start at quantity 1" })
  .refine((t) => t.every((tier, i) => i === 0 || tier.minQty > t[i - 1].minQty), { message: "Tiers must ascend by minQty" })
  .refine(
    (t) => t.every((tier, i) => i === 0 || tier.priceCentavos <= t[i - 1].priceCentavos),
    { message: "Per-item price must not increase as quantity rises" },
  );

export type PriceTierInput = z.infer<typeof priceTierSchema>;
