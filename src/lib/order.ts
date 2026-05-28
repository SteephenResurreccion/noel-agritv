import { z } from "zod";
import { cartItemSchema, type CartItem } from "@/lib/cart-store";

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
    message: "Enter a valid PH mobile number",
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
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: phoneSchema,
  region: z.string().trim().min(1, "Select a region"),
  province: z.string().trim().min(1, "Province is required").max(120),
  city: z.string().trim().min(1, "City/Municipality is required").max(120),
  barangay: z.string().trim().min(1, "Barangay is required").max(120),
  street: z.string().trim().min(1, "Street / house no. is required").max(200),
  landmark: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(1000).optional().default(""),
  consent: z.literal(true, {
    message: "You must agree to the privacy notice",
  }),
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  turnstileToken: z
    .string()
    .min(1, "Anti-spam check failed — please retry"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

/**
 * Generate an order number `NAG-YYYYMMDD-XXXX` (XXXX = 4 base-36 uppercase
 * chars) where the date is in Asia/Manila timezone. The date is computed via
 * `Intl.DateTimeFormat` so UTC instants near midnight Manila roll forward
 * correctly (e.g. `2026-05-21T16:30:00Z` → Manila `2026-05-22`).
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
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += Math.floor(Math.random() * 36)
      .toString(36)
      .toUpperCase();
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
