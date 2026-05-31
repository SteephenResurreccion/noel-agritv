import { z } from "zod";
import { cartItemSchema, type CartItem } from "@/lib/cart-store";
import { PH_REGIONS } from "@/lib/ph-regions";
import { copy } from "@/lib/copy";

/**
 * Normalize a PH mobile number to canonical "+639XXXXXXXXX", or null if invalid.
 *
 * Accepts:
 *   - `09XXXXXXXXX`     (11 digits, local PH mobile)
 *   - `+639XXXXXXXXX`   (E.164)
 *   - `639XXXXXXXXX`    (country code, no `+`)
 *
 * Spaces and dashes are stripped before validation. Landlines, short numbers,
 * and non-PH numbers return null.
 */
export function normalizePhPhone(raw: string): string | null {
  const digits = raw.replace(/[\s-]/g, "");
  if (/^09\d{9}$/.test(digits)) return "+63" + digits.slice(1);
  if (/^\+639\d{9}$/.test(digits)) return digits;
  if (/^639\d{9}$/.test(digits)) return "+" + digits;
  return null;
}

/** Zod helper that accepts any of the three PH mobile shapes. */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizePhPhone(v) !== null, {
    message: copy.errors.phone,
  });

/**
 * The full checkout payload schema.
 *
 * Region values are the `PH_REGIONS` values (validated against the list
 * server-side in Task 6). `consent` is a hard `literal(true)` — the RA 10173
 * privacy notice must be accepted. `items` must be a non-empty cart. The
 * Turnstile token is required client-side; the server re-verifies it.
 */
export const checkoutSchema = z.object({
  name: z.string().trim().min(1, copy.errors.nameRequired).max(120),
  phone: phoneSchema,
  region: z
    .string()
    .trim()
    .refine((v) => PH_REGIONS.some((r) => r.value === v), {
      message: copy.errors.regionInvalid,
    }),
  province: z.string().trim().min(1, copy.errors.provinceRequired).max(120),
  city: z.string().trim().min(1, copy.errors.cityRequired).max(120),
  barangay: z.string().trim().min(1, copy.errors.barangayRequired).max(120),
  street: z.string().trim().min(1, copy.errors.streetRequired).max(200),
  landmark: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  consent: z.literal(true, {
    message: copy.errors.privacyRequired,
  }),
  items: z
    .array(cartItemSchema)
    .min(1, copy.errors.cartEmpty)
    .max(50, copy.errors.cartTooMany),
  turnstileToken: z
    .string()
    .min(1, copy.errors.antiSpam),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Number of base-36 chars in the order-number random suffix (new orders). */
const ORDER_SUFFIX_LEN = 6;

/**
 * Generate an order number `NAG-YYYYMMDD-XXXXXX` (XXXXXX = 6 base-36 uppercase
 * chars) where the date is in Asia/Manila timezone. The date is computed via
 * `Intl.DateTimeFormat` so UTC instants near midnight Manila roll forward
 * correctly (e.g. `2026-05-21T16:30:00Z` → Manila `2026-05-22`).
 *
 * The suffix is drawn from `crypto.getRandomValues` (Web Crypto, available in
 * the Node/Edge runtime) — NOT `Math.random()` — and widened from 4 to 6 chars.
 * Per-day keyspace goes from 36^4 (~1.7M) to 36^6 (~2.2B), making the
 * birthday-collision probability negligible at this store's order volume.
 *
 * Legacy 4-char suffixes already issued remain valid for lookup; the guard in
 * `@/lib/lookup` (`ORDER_NUMBER_RE`) accepts a 4–6 char suffix for that reason.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const datePart = `${get("year")}${get("month")}${get("day")}`;
  const bytes = new Uint8Array(ORDER_SUFFIX_LEN);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (let i = 0; i < ORDER_SUFFIX_LEN; i++) {
    suffix += (bytes[i] % 36).toString(36).toUpperCase();
  }
  return `NAG-${datePart}-${suffix}`;
}

/**
 * Result the `submitOrder` server action returns to the form. Task 6 produces
 * this; Task 5 ships the type so the form's submit handler can be wired
 * end-to-end once Task 6 lands.
 */
export type SubmitResult =
  | { ok: true; orderNumber: string }
  | {
      ok: false;
      error: "validation" | "turnstile" | "sheets";
      message: string;
    };

/**
 * Assemble a raw payload from the form's field state + cart items + Turnstile
 * token. Does not validate — `checkoutSchema.safeParse` is what enforces the
 * contract. Returning `unknown` keeps the call site honest about that.
 */
export function buildCheckoutPayload(
  fields: {
    name: string;
    phone: string;
    region: string;
    province: string;
    city: string;
    barangay: string;
    street: string;
    landmark: string;
    notes: string;
    consent: boolean;
  },
  items: CartItem[],
  turnstileToken: string
): unknown {
  return { ...fields, items, turnstileToken };
}
