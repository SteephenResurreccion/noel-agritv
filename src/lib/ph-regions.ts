/**
 * The 17 Philippine regions and their fixed shipping-zone mapping.
 *
 * Geography is hardcoded (not admin-editable). Admins only edit the 4 zone fees
 * via `/admin/shipping`. The mapping mirrors the design spec §4.2:
 *  - NCR → ncr
 *  - CAR + Region I–V → luzon
 *  - Region VI–VIII → visayas
 *  - Region IX–XIII + BARMM → mindanao
 */

export type ShippingZone = "ncr" | "luzon" | "visayas" | "mindanao";

export interface PhRegion {
  /** stable value submitted by the <select>; also stored in the Sheet */
  value: string;
  /** human label shown in the dropdown */
  label: string;
  zone: ShippingZone;
}

/** The 17 PH regions, each mapped to a fixed shipping zone (hardcoded geography). */
export const PH_REGIONS: PhRegion[] = [
  { value: "NCR", label: "NCR (Metro Manila)", zone: "ncr" },
  { value: "CAR", label: "CAR (Cordillera)", zone: "luzon" },
  { value: "REGION_1", label: "Region I (Ilocos)", zone: "luzon" },
  { value: "REGION_2", label: "Region II (Cagayan Valley)", zone: "luzon" },
  { value: "REGION_3", label: "Region III (Central Luzon)", zone: "luzon" },
  { value: "REGION_4A", label: "Region IV-A (CALABARZON)", zone: "luzon" },
  { value: "REGION_4B", label: "Region IV-B (MIMAROPA)", zone: "luzon" },
  { value: "REGION_5", label: "Region V (Bicol)", zone: "luzon" },
  { value: "REGION_6", label: "Region VI (Western Visayas)", zone: "visayas" },
  { value: "REGION_7", label: "Region VII (Central Visayas)", zone: "visayas" },
  { value: "REGION_8", label: "Region VIII (Eastern Visayas)", zone: "visayas" },
  { value: "REGION_9", label: "Region IX (Zamboanga Peninsula)", zone: "mindanao" },
  { value: "REGION_10", label: "Region X (Northern Mindanao)", zone: "mindanao" },
  { value: "REGION_11", label: "Region XI (Davao)", zone: "mindanao" },
  { value: "REGION_12", label: "Region XII (SOCCSKSARGEN)", zone: "mindanao" },
  { value: "REGION_13", label: "Region XIII (Caraga)", zone: "mindanao" },
  { value: "BARMM", label: "BARMM", zone: "mindanao" },
];

/** Return the shipping zone for a region value, or null if the value isn't recognized. */
export function zoneForRegion(regionValue: string): ShippingZone | null {
  return PH_REGIONS.find((r) => r.value === regionValue)?.zone ?? null;
}
