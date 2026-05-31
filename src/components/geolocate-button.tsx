"use client";

import { useState } from "react";
import { PH_REGIONS } from "@/lib/ph-regions";
import { loadRegion, type PsgcRegion } from "@/lib/psgc";
import { reverseGeocode, type NominatimAddress } from "@/lib/nominatim";
import { copy } from "@/lib/copy";

/**
 * "Use my location" button for the checkout address section.
 *
 * Flow:
 *   1. Ask the browser for geolocation (one-shot, no watch).
 *   2. POST the coords to `/api/geocode` (Nominatim proxy).
 *   3. Map Nominatim's `address.{state, city, suburb, road}` to PH regions →
 *      best-effort string match against the PSGC tree → call `onPrefill`.
 *
 * Anything that fails surfaces as an inline status message; the user falls
 * back to the manual dropdown picker. No throws bubble to the form.
 */

export interface GeolocatePrefill {
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
}

export interface GeolocateButtonProps {
  onPrefill: (fields: GeolocatePrefill) => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "geocoding" }
  | { kind: "matching" }
  | { kind: "success" }
  | { kind: "denied" }
  | { kind: "unavailable" }
  | { kind: "no-match" };

const STATUS_TEXT: Record<Status["kind"], string> = {
  idle: "",
  locating: copy.geolocate.locating,
  geocoding: copy.geolocate.geocoding,
  matching: copy.geolocate.matching,
  success: copy.geolocate.success,
  denied: copy.geolocate.denied,
  unavailable: copy.geolocate.unavailable,
  "no-match": copy.geolocate.noMatch,
};

/**
 * Map Nominatim's free-form region/state name to a PH_REGIONS value.
 * Returns null if no plausible mapping. The match is intentionally loose:
 * Nominatim returns names like "Metro Manila", "Calabarzon", "Region IV-A
 * (CALABARZON)", "Ilocos Region" — all of which we want to recognize.
 */
function mapNominatimRegionToPhRegion(addr: NominatimAddress): string | null {
  const candidates = [
    addr.region,
    addr.state,
    addr.state_district,
    addr.county,
    addr.province,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  if (candidates.length === 0) return null;

  // Keywords that uniquely identify each PH region. Order matters — match
  // most specific first.
  const TABLE: Array<{ value: string; needles: string[] }> = [
    { value: "NCR", needles: ["metro manila", "national capital", "ncr"] },
    { value: "CAR", needles: ["cordillera", "car"] },
    { value: "BARMM", needles: ["bangsamoro", "barmm", "armm"] },
    {
      value: "REGION_4A",
      needles: ["calabarzon", "region iv-a", "region 4-a", "region 4a"],
    },
    {
      value: "REGION_4B",
      needles: ["mimaropa", "region iv-b", "region 4-b", "region 4b"],
    },
    { value: "REGION_1", needles: ["ilocos", "region i ", "region 1"] },
    {
      value: "REGION_2",
      needles: ["cagayan valley", "region ii", "region 2"],
    },
    {
      value: "REGION_3",
      needles: ["central luzon", "region iii", "region 3"],
    },
    { value: "REGION_5", needles: ["bicol", "region v", "region 5"] },
    {
      value: "REGION_6",
      needles: ["western visayas", "region vi", "region 6"],
    },
    {
      value: "REGION_7",
      needles: ["central visayas", "region vii", "region 7"],
    },
    {
      value: "REGION_8",
      needles: ["eastern visayas", "region viii", "region 8"],
    },
    {
      value: "REGION_9",
      needles: ["zamboanga peninsula", "region ix", "region 9"],
    },
    {
      value: "REGION_10",
      needles: ["northern mindanao", "region x", "region 10"],
    },
    { value: "REGION_11", needles: ["davao", "region xi", "region 11"] },
    {
      value: "REGION_12",
      needles: ["soccsksargen", "region xii", "region 12"],
    },
    { value: "REGION_13", needles: ["caraga", "region xiii", "region 13"] },
  ];

  for (const row of TABLE) {
    for (const needle of row.needles) {
      if (candidates.some((c) => c.includes(needle))) {
        return row.value;
      }
    }
  }
  return null;
}

/** Loose match: lowercase contains, both ways. Returns the canonical name from `haystack` if found. */
function fuzzyFind(haystack: string[], needle: string | undefined): string {
  if (!needle) return "";
  const n = needle.toLowerCase().trim();
  if (!n) return "";
  // Strip "city of " / "municipality of " — Nominatim often abbreviates.
  const nStripped = n
    .replace(/^city of\s+/, "")
    .replace(/^municipality of\s+/, "");
  for (const h of haystack) {
    const hl = h.toLowerCase();
    const hStripped = hl
      .replace(/^city of\s+/, "")
      .replace(/^municipality of\s+/, "");
    if (
      hl === n ||
      hStripped === nStripped ||
      hl.includes(n) ||
      n.includes(hl) ||
      hStripped.includes(nStripped) ||
      nStripped.includes(hStripped)
    ) {
      return h;
    }
  }
  return "";
}

/** Find the PSGC province/city/barangay best matching the Nominatim address. */
function mapAddressToPsgc(addr: NominatimAddress, data: PsgcRegion) {
  // Nominatim's "province" or "state_district" usually matches PSGC province.
  const provNeedle =
    addr.province ||
    addr.state_district ||
    addr.county ||
    addr.region ||
    addr.state;
  const province = fuzzyFind(
    data.provinces.map((p) => p.name),
    typeof provNeedle === "string" ? provNeedle : undefined
  );

  // If province didn't match (e.g. NCR has one synthetic province), use the
  // first province whose cities contain the city we want.
  const cityNeedle =
    addr.city || addr.town || addr.municipality || addr.village;
  let chosenProv = data.provinces.find((p) => p.name === province) ?? null;
  if (!chosenProv && cityNeedle) {
    for (const p of data.provinces) {
      if (
        fuzzyFind(
          p.cities.map((c) => c.name),
          typeof cityNeedle === "string" ? cityNeedle : undefined
        )
      ) {
        chosenProv = p;
        break;
      }
    }
  }
  // Last fallback: first province in the region.
  if (!chosenProv) chosenProv = data.provinces[0] ?? null;

  const city = chosenProv
    ? fuzzyFind(
        chosenProv.cities.map((c) => c.name),
        typeof cityNeedle === "string" ? cityNeedle : undefined
      )
    : "";

  const brgyNeedle = addr.suburb || addr.neighbourhood || addr.quarter;
  const chosenCity = chosenProv?.cities.find((c) => c.name === city) ?? null;
  const barangay = chosenCity
    ? fuzzyFind(
        chosenCity.barangays,
        typeof brgyNeedle === "string" ? brgyNeedle : undefined
      )
    : "";

  const street = [addr.house_number, addr.road || addr.pedestrian]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    province: chosenProv?.name ?? "",
    city,
    barangay,
    street,
  };
}

export function GeolocateButton({ onPrefill }: GeolocateButtonProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleClick() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus({ kind: "unavailable" });
      return;
    }
    setStatus({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setStatus({ kind: "geocoding" });
          const result = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          const addr = result.address ?? {};
          const regionValue = mapNominatimRegionToPhRegion(addr);
          if (!regionValue) {
            setStatus({ kind: "no-match" });
            return;
          }
          setStatus({ kind: "matching" });
          const data = await loadRegion(regionValue);
          const mapped = mapAddressToPsgc(addr, data);
          onPrefill({
            region: regionValue,
            province: mapped.province,
            city: mapped.city,
            barangay: mapped.barangay,
            street: mapped.street,
          });
          setStatus({ kind: "success" });
        } catch (e) {
          console.error("GeolocateButton geocode failed:", e);
          setStatus({ kind: "unavailable" });
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED || err.code === 1) {
          setStatus({ kind: "denied" });
        } else {
          setStatus({ kind: "unavailable" });
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  const busy =
    status.kind === "locating" ||
    status.kind === "geocoding" ||
    status.kind === "matching";

  const errorStatus =
    status.kind === "denied" ||
    status.kind === "unavailable" ||
    status.kind === "no-match";

  let errorText = "";
  if (status.kind === "denied") {
    errorText = STATUS_TEXT.denied;
  } else if (status.kind === "unavailable") {
    errorText = STATUS_TEXT.unavailable;
  } else if (status.kind === "no-match") {
    errorText = STATUS_TEXT["no-match"];
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md border border-brand-mid bg-surface px-4 py-3 text-sm font-medium text-brand-darkest hover:bg-bg-wheat disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? STATUS_TEXT[status.kind] : copy.geolocate.use}
      </button>
      {status.kind === "success" && (
        <p className="text-sm text-text-secondary">{STATUS_TEXT.success}</p>
      )}
      {errorStatus && (
        <p className="text-sm text-destructive" role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
}
