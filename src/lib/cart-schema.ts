import "@/lib/zod-config"; // CSP: disable Zod JIT before any z.object() (no unsafe-eval)
import { z } from "zod";
import type { CartItem } from "@/lib/cart-store";

/**
 * Server-side Zod schema for a single cart line.
 *
 * Lives in its OWN module (not in the client `cart-store.ts`) so the zod vendor
 * chunk never enters the storefront client bundle: `cart-store.ts` is imported by
 * the layout-level `"use client"` CheckoutBar / cart-badge, so anything it touches
 * lands in first-load JS on every storefront route. `cart-store.ts` now ships a
 * hand-written `CartItem` interface instead, and this schema is reachable only
 * from server code.
 *
 * Consumed at runtime ONLY server-side by `submitOrder` (src/lib/order.ts), which
 * re-validates the posted cart (`z.array(cartItemSchema)`) before re-pricing and
 * writing to Sheets — the client is never trusted for prices.
 */
export const cartItemSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  priceCentavos: z.number().int().nonnegative(),
  priceTiers: z
    .array(z.object({ minQty: z.number().int().positive(), priceCentavos: z.number().int().nonnegative() }))
    .optional(),
  qty: z.number().int().min(1).max(99),
  // Generous cap: proxied blob images ("/api/blob-image?url=<encoded blob url>")
  // run ~130 chars; 500 bounds DoS without rejecting long-slug product images.
  image: z.string().min(1).max(500),
});

/**
 * Compile-time guarantee that this server schema and the client-side `CartItem`
 * interface stay structurally identical. `CartItem` used to be
 * `z.infer<typeof cartItemSchema>`; moving the schema out of the client bundle
 * made the interface hand-written, so this assertion is what stops the two from
 * drifting silently. If they diverge, `Equals<…>` resolves to `false` and the
 * `Expect<false>` line below fails to type-check (caught by `tsc --noEmit`).
 * Pure type-level — erased at build, ships nothing.
 */
type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
  ? true
  : false;
type Expect<T extends true> = T;
// Exported so it counts as "used" (no unused-var lint); nothing imports it. The
// value is irrelevant — its only job is to fail compilation if the shapes drift.
export type AssertSchemaMatchesCartItem = Expect<Equals<z.infer<typeof cartItemSchema>, CartItem>>;
