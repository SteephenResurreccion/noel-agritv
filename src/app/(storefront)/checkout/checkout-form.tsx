"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatCentavos } from "@/lib/utils";
import { resolveShipping } from "@/lib/shipping";
import type { ShippingConfig } from "@/lib/admin-store";
import type { PhRegion } from "@/lib/ph-regions";
import { checkoutSchema, buildCheckoutPayload } from "@/lib/order";
import { TurnstileWidget } from "@/components/turnstile-widget";

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

  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [token, setToken] = useState<string>("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const estimate = useMemo(
    () => resolveShipping(shipping, fields.region),
    [shipping, fields.region]
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
    // Submit network call is wired in Task 6 (submitOrder server action).
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
              className={INPUT_CLASS}
            />
            {errors.name?.[0] && <p className={ERROR_CLASS}>{errors.name[0]}</p>}
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
              className={INPUT_CLASS}
            />
            {errors.phone?.[0] && (
              <p className={ERROR_CLASS}>{errors.phone[0]}</p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-[length:var(--font-size-h2)] font-semibold text-brand-darkest">
            Delivery address
          </h2>
          <div>
            <label htmlFor="region" className={LABEL_CLASS}>
              Region
            </label>
            <select
              id="region"
              name="region"
              required
              value={fields.region}
              onChange={(e) => updateField("region", e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select a region…</option>
              {regions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.region?.[0] && (
              <p className={ERROR_CLASS}>{errors.region[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="province" className={LABEL_CLASS}>
              Province
            </label>
            <input
              id="province"
              name="province"
              type="text"
              required
              value={fields.province}
              onChange={(e) => updateField("province", e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.province?.[0] && (
              <p className={ERROR_CLASS}>{errors.province[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="city" className={LABEL_CLASS}>
              City / Municipality
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              value={fields.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.city?.[0] && <p className={ERROR_CLASS}>{errors.city[0]}</p>}
          </div>
          <div>
            <label htmlFor="barangay" className={LABEL_CLASS}>
              Barangay
            </label>
            <input
              id="barangay"
              name="barangay"
              type="text"
              required
              value={fields.barangay}
              onChange={(e) => updateField("barangay", e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.barangay?.[0] && (
              <p className={ERROR_CLASS}>{errors.barangay[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="street" className={LABEL_CLASS}>
              Street / House no.
            </label>
            <input
              id="street"
              name="street"
              type="text"
              required
              value={fields.street}
              onChange={(e) => updateField("street", e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.street?.[0] && (
              <p className={ERROR_CLASS}>{errors.street[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="landmark" className={LABEL_CLASS}>
              Landmark (optional)
            </label>
            <input
              id="landmark"
              name="landmark"
              type="text"
              value={fields.landmark}
              onChange={(e) => updateField("landmark", e.target.value)}
              className={INPUT_CLASS}
            />
            {errors.landmark?.[0] && (
              <p className={ERROR_CLASS}>{errors.landmark[0]}</p>
            )}
          </div>
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
              className={INPUT_CLASS}
            />
            {errors.notes?.[0] && (
              <p className={ERROR_CLASS}>{errors.notes[0]}</p>
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
              className="mt-1 h-4 w-4 rounded border-border text-brand-mid focus:ring-brand-mid"
            />
            <span>{RA_10173_NOTICE}</span>
          </label>
          {errors.consent?.[0] && (
            <p className={ERROR_CLASS}>{errors.consent[0]}</p>
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
          {estimate.showFee ? (
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
          type="button"
          disabled
          title="Submit wired in Task 6"
          className="mt-2 block w-full rounded-md bg-brand-darkest px-5 py-3 text-center text-sm font-semibold text-white opacity-60 cursor-not-allowed"
        >
          Place order
        </button>
      </aside>
    </form>
  );
}
