/**
 * Browser-side helper for the `/api/geocode` proxy that wraps Nominatim's
 * reverse-geocoder. We can't call Nominatim directly from the browser — their
 * fair-use policy demands a real User-Agent header, which browser fetch isn't
 * allowed to set. The server route attaches the UA and forwards the response.
 *
 * Only the address fields the checkout cares about are typed; anything else
 * Nominatim sends is preserved as `unknown` so we don't break on schema drift.
 */
export interface NominatimAddress {
  /** Some Nominatim responses use `region`, others use `state` or `state_district`. */
  region?: string;
  state?: string;
  state_district?: string;
  province?: string;
  county?: string;
  /** City vs. town vs. municipality vs. village — Nominatim picks one. */
  city?: string;
  town?: string;
  municipality?: string;
  village?: string;
  /** Barangays are tagged as `suburb`, `neighbourhood`, or `quarter`. */
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  /** Street / road. */
  road?: string;
  pedestrian?: string;
  house_number?: string;
  postcode?: string;
  country_code?: string;
  /** Carry-through for fields we didn't enumerate. */
  [k: string]: unknown;
}

export interface NominatimResult {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: NominatimAddress;
  [k: string]: unknown;
}

/** Thrown for bad input, network failure, or non-2xx from the proxy. */
export class NominatimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NominatimError";
  }
}

/**
 * Reverse-geocode a `(lat, lon)` via the project's `/api/geocode` proxy.
 *
 * Bounds-checks coordinates before fetching so we never hit the proxy with
 * obvious junk. `fetchImpl` is injectable for tests; defaults to the global
 * `fetch`. Any failure surfaces as `NominatimError` — callers show an inline
 * "pick manually" status.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  fetchImpl: typeof fetch = fetch
): Promise<NominatimResult> {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    throw new NominatimError(`Invalid coordinates: lat=${lat}, lon=${lon}`);
  }
  const url = `/api/geocode?lat=${encodeURIComponent(
    String(lat)
  )}&lon=${encodeURIComponent(String(lon))}`;
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch (e) {
    throw new NominatimError(`Geocode request failed: ${(e as Error).message}`);
  }
  if (!res.ok) {
    throw new NominatimError(`Geocode responded ${res.status}`);
  }
  return (await res.json()) as NominatimResult;
}
