"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ZodObject, ZodTypeAny } from "zod";
import { useCart } from "@/lib/cart-store";
import { formatCentavos } from "@/lib/utils";
import { resolveShipping } from "@/lib/shipping";
import type { ShippingConfig } from "@/lib/admin-store";
import type { PhRegion } from "@/lib/ph-regions";
import { checkoutSchema, buildCheckoutPayload } from "@/lib/order";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { AddressFields, type AddressField } from "@/components/address-fields";
import { GeolocateButton } from "@/components/geolocate-button";
import { MESSENGER_URL } from "@/lib/constants";
import { submitOrder } from "./actions";

export interface CheckoutFormProps {
  shipping: ShippingConfig;
  regions: PhRegion[];
}

type FieldErrors = Partial<
  Record<
    | "name"
    | "phone"
    | "region"
    | "province"
    | "city"
    | "barangay"
    | "street"
    | "landmark"
    | "notes"
    | "consent"
    | "items"
    | "turnstileToken",
    string[]
  >
>;

interface FormFields {
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
}

const INITIAL_FIELDS: FormFields = {
  name: "",
  phone: "",
  region: "",
  province: "",
  city: "",
  barangay: "",
  street: "",
  landmark: "",
  notes: "",
  consent: false,
};

const RA_10173_NOTICE =
  "By placing this order you agree that Noel AgriTV will use your name, phone number, and address solely to process and deliver your order, per the Data Privacy Act of 2012 (RA 10173).";

const LABEL_CLASS =
  "block text-sm font-medium text-text-primary";
const INPUT_CLASS =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary placeholder:text-text-disabled focus:border-brand-mid focus:outline-none focus:ring-1 focus:ring-brand-mid";
const ERROR_CLASS = "mt-1 text-sm text-destructive";

export function CheckoutForm({ shipping, regions }: CheckoutFormProps) {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalCentavos());
  const totalUnits = useCart((s) => s.totalItems());

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [token, setToken] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [sheetsFallback, setSheetsFallback] = useState<string>("");

  // Pass the cart's total units so the summary mirrors the server: at
  // FREE_SHIPPING_MIN_UNITS+ units resolveShipping returns { free:true } and
  // we render "FREE", instead of a region fee / "confirmed on call". The
  // server (submitOrder) recomputes this independently and stays authoritative.
  const estimate = useMemo(
    () => resolveShipping(shipping, fields.region, totalUnits),
    [shipping, fields.region, totalUnits]
  );

  /**
   * Re-validate a single top-level field against `checkoutSchema.shape[name]`
   * and update the `errors` state. Used by `onChange` handlers so a field's
   * error message clears as soon as the user types a valid value (instead of
   * waiting for the next submit).
   *
   * Gated on "field already has an error" — we don't surface validation
   * messages before the user has tried to submit at least once.
   *
   * MUST stay above the empty-cart early return below: the cart store hydrates
   * from localStorage after first paint, so this component renders once empty
   * (early return) and again populated. A hook placed below the return would
   * change the hook count between those renders → "Rendered more/fewer hooks
   * than expected". All hooks stay unconditional; only the JSX is conditional.
   */
  const validateField = useCallback(
    (name: keyof FieldErrors, value: unknown) => {
      // Only re-validate fields that currently have an error visible. This is
      // the simplest way to avoid showing errors mid-typing on a fresh form.
      setErrors((prev) => {
        if (!prev[name]) return prev;
        const shape = (checkoutSchema as unknown as ZodObject<Record<string, ZodTypeAny>>)
          .shape;
        const fieldSchema = shape[name as string];
        if (!fieldSchema) return prev;
        const result = fieldSchema.safeParse(value);
        const next = { ...prev };
        if (result.success) {
          delete next[name];
        } else {
          next[name] = result.error.issues.map((e) => e.message);
        }
        return next;
      });
    },
    []
  );

  if (items.length === 0) {
    return (
      <div className="py-[var(--spacing-section)] text-center">
        <h2 className="text-[length:var(--font-size-h1)] font-bold text-brand-darkest">
          Your cart is empty
        </h2>
        <Link
          href="/products"
          className="mt-4 inline-block rounded-md bg-brand-darkest px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  function updateField<K extends keyof FormFields>(
    key: K,
    value: FormFields[K]
  ) {
    setFields((prev) => ({ ...prev, [key]: value }));
    // Live-clear/refresh the per-field error so the user sees the form react
    // as they fix invalid values — no waiting for the next submit.
    validateField(key as keyof FieldErrors, value);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = buildCheckoutPayload(fields, items, token);
    const result = checkoutSchema.safeParse(payload);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors as FieldErrors);
      return;
    }
    setErrors({});
    setSubmitError("");
    setSheetsFallback("");
    startTransition(async () => {
      const res = await submitOrder(payload);
      if (res.ok) {
        // Clear cart BEFORE navigating. If the router.push is interrupted
        // (FB IAB nav glitch, network blip, tab close) the cart is already
        // empty, so a return visit can't accidentally resubmit the order.
        // The confirmation page also clears as a defensive safety-net.
        useCart.getState().clear();
        router.push(
          `/checkout/confirmation?order=${encodeURIComponent(res.orderNumber)}`
        );
        return;
      }
      if (res.error === "sheets") {
        setSheetsFallback(res.message);
        return;
      }
      // validation | turnstile — show inline + reset the token so user re-solves.
      setSubmitError(res.message);
      setToken("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 md:grid-cols-[1fr_360px]"
      noValidate
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Contact
          </h2>
          <div>
            <label htmlFor="name" className={LABEL_CLASS}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={fields.name}
              onChange={(e) => updateField("name", e.target.value)}
              aria-invalid={errors.name?.[0] ? "true" : "false"}
              aria-describedby={errors.name?.[0] ? "name-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.name?.[0] && (
              <p id="name-error" role="alert" className={ERROR_CLASS}>
                {errors.name[0]}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className={LABEL_CLASS}>
              Mobile number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              placeholder="09XXXXXXXXX"
              value={fields.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              aria-invalid={errors.phone?.[0] ? "true" : "false"}
              aria-describedby={errors.phone?.[0] ? "phone-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.phone?.[0] && (
              <p id="phone-error" role="alert" className={ERROR_CLASS}>
                {errors.phone[0]}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Delivery address
          </h2>
          <GeolocateButton
            onPrefill={(p) => {
              setFields((prev) => ({
                ...prev,
                region: p.region,
                province: p.province,
                city: p.city,
                barangay: p.barangay,
                // Only overwrite street if the geocoder actually found one.
                street: p.street || prev.street,
              }));
            }}
          />
          <AddressFields
            regions={regions}
            region={fields.region}
            province={fields.province}
            city={fields.city}
            barangay={fields.barangay}
            street={fields.street}
            landmark={fields.landmark}
            onChange={(field, value) =>
              updateField(field as AddressField, value)
            }
            errors={{
              region: errors.region?.[0],
              province: errors.province?.[0],
              city: errors.city?.[0],
              barangay: errors.barangay?.[0],
              street: errors.street?.[0],
              landmark: errors.landmark?.[0],
            }}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Order notes
          </h2>
          <div>
            <label htmlFor="notes" className={LABEL_CLASS}>
              Notes for the team (optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={fields.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              aria-invalid={errors.notes?.[0] ? "true" : "false"}
              aria-describedby={errors.notes?.[0] ? "notes-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.notes?.[0] && (
              <p id="notes-error" role="alert" className={ERROR_CLASS}>
                {errors.notes[0]}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Payment
          </h2>
          <p className="rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary">
            Cash on Delivery (COD)
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Privacy
          </h2>
          <label className="flex items-start gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              name="consent"
              required
              checked={fields.consent}
              onChange={(e) => updateField("consent", e.target.checked)}
              aria-invalid={errors.consent?.[0] ? "true" : "false"}
              aria-describedby={
                errors.consent?.[0] ? "consent-error" : undefined
              }
              className="mt-1 h-4 w-4 rounded border-border text-brand-mid focus:ring-brand-mid"
            />
            <span>{RA_10173_NOTICE}</span>
          </label>
          {errors.consent?.[0] && (
            <p id="consent-error" role="alert" className={ERROR_CLASS}>
              {errors.consent[0]}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <TurnstileWidget onToken={setToken} />
          {errors.turnstileToken?.[0] && (
            <p className={ERROR_CLASS}>{errors.turnstileToken[0]}</p>
          )}
        </section>
      </div>

      <aside className="space-y-4 self-start rounded-md border border-border bg-surface p-4">
        <h2 className="text-[length:var(--font-size-h3)] font-semibold text-brand-darkest">
          Order summary
        </h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.slug} className="flex items-center gap-3">
              <img
                src={i.image}
                alt={i.name}
                className="h-12 w-12 rounded-md object-cover"
              />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-text-primary">{i.name}</p>
                <p className="text-text-secondary">
                  {formatCentavos(i.priceCentavos)} × {i.qty}
                </p>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {formatCentavos(i.priceCentavos * i.qty)}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between text-text-primary">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCentavos(subtotal)}</span>
          </div>
          {estimate.free ? (
            <>
              <div className="mt-2 flex items-center justify-between text-text-primary">
                <span>Shipping</span>
                <span className="font-bold text-brand-mid">FREE</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base">
                <span className="font-semibold text-brand-darkest">
                  Estimated total
                </span>
                <span className="font-bold text-brand-darkest">
                  {formatCentavos(subtotal)}
                </span>
              </div>
            </>
          ) : estimate.showFee ? (
            <>
              <div className="mt-2 flex items-center justify-between text-text-primary">
                <span>Estimated shipping</span>
                <span className="font-semibold">
                  {formatCentavos(estimate.shippingCentavos)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-base">
                <span className="font-semibold text-brand-darkest">
                  Estimated total
                </span>
                <span className="font-bold text-brand-darkest">
                  {formatCentavos(subtotal + estimate.shippingCentavos)}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-text-secondary">
              Shipping confirmed on the call.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || !token}
          className="mt-2 block w-full rounded-md bg-brand-darkest px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Placing order…" : "Place order"}
        </button>

        {submitError && (
          <p className={ERROR_CLASS} role="alert">
            {submitError}
          </p>
        )}

        {sheetsFallback && (
          <div
            role="alert"
            className="mt-3 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p>{sheetsFallback}</p>
            <a
              href={MESSENGER_URL}
              className="mt-2 inline-block font-semibold underline"
            >
              Message us to complete your order
            </a>
          </div>
        )}
      </aside>
    </form>
  );
}
