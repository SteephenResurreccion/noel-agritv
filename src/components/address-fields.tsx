"use client";

import { useEffect, useState } from "react";
import type { PhRegion } from "@/lib/ph-regions";
import {
  loadRegion,
  type PsgcRegion,
  type PsgcProvince,
  type PsgcCity,
} from "@/lib/psgc";
import { useCopy } from "@/lib/lang-context";

/**
 * Cascading address picker for the checkout form.
 *
 * State is owned by the parent — this component is fully controlled. We do
 * three things on top of plain `<select>` elements:
 *   1. Lazy-fetch `/data/psgc/<region>.json` when `region` changes. The file
 *      is ~15-60KB; not bundling it keeps first-load JS under the 150KB
 *      budget.
 *   2. Disable a child select while its parent is empty (Region empty ⇒
 *      Province disabled, etc.).
 *   3. Surface fetch errors as a small inline message; the user falls back to
 *      typing nothing in the dropdown (the parent's text-validated schema
 *      still applies).
 *
 * Native `<select>` is intentional — Android renders these as full-screen
 * pickers that are far easier than custom combobox UIs on budget phones.
 */

const LABEL_CLASS = "block text-sm font-medium text-text-primary";
const INPUT_CLASS =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary placeholder:text-text-disabled focus:border-brand-mid focus:outline-none focus:ring-1 focus:ring-brand-mid disabled:opacity-60 disabled:bg-bg disabled:cursor-not-allowed";

export type AddressField =
  | "region"
  | "province"
  | "city"
  | "barangay"
  | "street"
  | "landmark";

export interface AddressFieldsProps {
  regions: PhRegion[];
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  landmark: string;
  onChange: (field: AddressField, value: string) => void;
  /** Optional per-field error messages from the form's Zod validation. */
  errors?: Partial<Record<AddressField, string>>;
}

export function AddressFields({
  regions,
  region,
  province,
  city,
  barangay,
  street,
  landmark,
  onChange,
  errors,
}: AddressFieldsProps) {
  const copy = useCopy();
  const loadErrorText = copy.addressFields.loadError;
  const [data, setData] = useState<PsgcRegion | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>("");

  // Fetch the region tree when `region` changes. Cleared back to null when
  // the user empties the region — the cascade collapses cleanly.
  //
  // All state updates live inside the async `run` continuation (after the
  // first `await`) rather than synchronously in the effect body. This keeps
  // the observable behavior identical — empty region clears state, a chosen
  // region shows the loader then resolves to data or an error — while
  // satisfying `react-hooks/set-state-in-effect` (no synchronous setState in
  // an effect). The `await null` microtask defers the resets off the render
  // path; they still flush before paint, so there is no visible delay.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      await null;
      if (cancelled) return;

      if (!region) {
        setData(null);
        setLoadError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");
      try {
        const r = await loadRegion(region);
        if (cancelled) return;
        setData(r);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setData(null);
        setLoading(false);
        setLoadError(loadErrorText);
        // Surface for debugging but don't crash.
        console.error("AddressFields loadRegion failed:", e);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [region, loadErrorText]);

  const provinces: PsgcProvince[] = data?.provinces ?? [];
  const selectedProvince = provinces.find((p) => p.name === province) ?? null;
  const cities: PsgcCity[] = selectedProvince?.cities ?? [];
  const selectedCity = cities.find((c) => c.name === city) ?? null;
  const barangays: string[] = selectedCity?.barangays ?? [];

  const provinceDisabled = !region || loading || provinces.length === 0;
  const cityDisabled = !province || cities.length === 0;
  const barangayDisabled = !city || barangays.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="region" className={LABEL_CLASS}>
          {copy.addressFields.region}
        </label>
        <select
          id="region"
          name="region"
          required
          value={region}
          onChange={(e) => {
            onChange("region", e.target.value);
            // Reset deeper fields when the region changes.
            onChange("province", "");
            onChange("city", "");
            onChange("barangay", "");
          }}
          aria-invalid={errors?.region ? "true" : "false"}
          aria-describedby={errors?.region ? "region-error" : undefined}
          className={INPUT_CLASS}
        >
          <option value="">{copy.addressFields.selectRegion}</option>
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {errors?.region && (
          <p
            id="region-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.region}
          </p>
        )}
        {loading && (
          <p className="mt-1 text-sm text-text-secondary">
            {copy.addressFields.loadingProvinces}
          </p>
        )}
        {loadError && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="province" className={LABEL_CLASS}>
          {copy.addressFields.province}
        </label>
        <select
          id="province"
          name="province"
          required
          value={province}
          disabled={provinceDisabled}
          onChange={(e) => {
            onChange("province", e.target.value);
            onChange("city", "");
            onChange("barangay", "");
          }}
          aria-invalid={errors?.province ? "true" : "false"}
          aria-describedby={errors?.province ? "province-error" : undefined}
          className={INPUT_CLASS}
        >
          <option value="">
            {region
              ? copy.addressFields.selectProvince
              : copy.addressFields.pickRegionFirst}
          </option>
          {provinces.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        {errors?.province && (
          <p
            id="province-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.province}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="city" className={LABEL_CLASS}>
          {copy.addressFields.city}
        </label>
        <select
          id="city"
          name="city"
          required
          value={city}
          disabled={cityDisabled}
          onChange={(e) => {
            onChange("city", e.target.value);
            onChange("barangay", "");
          }}
          aria-invalid={errors?.city ? "true" : "false"}
          aria-describedby={errors?.city ? "city-error" : undefined}
          className={INPUT_CLASS}
        >
          <option value="">
            {province
              ? copy.addressFields.selectCity
              : copy.addressFields.pickProvinceFirst}
          </option>
          {cities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {errors?.city && (
          <p
            id="city-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.city}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="barangay" className={LABEL_CLASS}>
          {copy.addressFields.barangay}
        </label>
        <select
          id="barangay"
          name="barangay"
          required
          value={barangay}
          disabled={barangayDisabled}
          onChange={(e) => onChange("barangay", e.target.value)}
          aria-invalid={errors?.barangay ? "true" : "false"}
          aria-describedby={errors?.barangay ? "barangay-error" : undefined}
          className={INPUT_CLASS}
        >
          <option value="">
            {city
              ? copy.addressFields.selectBarangay
              : copy.addressFields.pickCityFirst}
          </option>
          {barangays.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        {errors?.barangay && (
          <p
            id="barangay-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.barangay}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="street" className={LABEL_CLASS}>
          {copy.addressFields.street}
        </label>
        <input
          id="street"
          name="street"
          type="text"
          required
          value={street}
          onChange={(e) => onChange("street", e.target.value)}
          aria-invalid={errors?.street ? "true" : "false"}
          aria-describedby={errors?.street ? "street-error" : undefined}
          className={INPUT_CLASS}
        />
        {errors?.street && (
          <p
            id="street-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.street}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="landmark" className={LABEL_CLASS}>
          {copy.addressFields.landmark}
        </label>
        <input
          id="landmark"
          name="landmark"
          type="text"
          value={landmark}
          onChange={(e) => onChange("landmark", e.target.value)}
          aria-invalid={errors?.landmark ? "true" : "false"}
          aria-describedby={errors?.landmark ? "landmark-error" : undefined}
          className={INPUT_CLASS}
        />
        {errors?.landmark && (
          <p
            id="landmark-error"
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {errors.landmark}
          </p>
        )}
      </div>
    </div>
  );
}
