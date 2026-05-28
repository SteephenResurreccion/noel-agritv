import { PH_REGIONS } from "@/lib/ph-regions";

/**
 * Philippine Standard Geographic Code (PSGC) shape used by the checkout
 * cascading address picker. Source: `flores-jacob/philippine-regions-provinces-
 * cities-municipalities-barangays` (public-domain mirror of PSA data),
 * transformed into one file per region under `/public/data/psgc/`.
 *
 * Each `region` value matches a `PhRegion.value` from `ph-regions.ts`
 * (e.g. `"NCR"`, `"REGION_4A"`, `"BARMM"`) — that's how the loader maps the
 * user's dropdown choice to a JSON file.
 *
 * Strings are Title-cased (`"City of Manila"`, `"Pulang Lupa Uno"`) so the
 * dropdowns are readable; the source data is uppercase.
 */
export interface PsgcCity {
  name: string;
  barangays: string[];
}

export interface PsgcProvince {
  name: string;
  cities: PsgcCity[];
}

export interface PsgcRegion {
  region: string;
  provinces: PsgcProvince[];
}

/** Thrown by `loadRegion` for invalid region values or fetch failures. */
export class PsgcLoadError extends Error {
  constructor(message: string, public readonly region?: string) {
    super(message);
    this.name = "PsgcLoadError";
  }
}

// In-memory cache. The PSGC files are static and never change at runtime, so
// caching is unconditional. The Map survives only the page's JS lifetime — a
// hard reload re-fetches. That's intentional: HTTP cache headers from the CDN
// handle disk-level caching.
const cache = new Map<string, Promise<PsgcRegion>>();

/** Test-only: drop the in-memory cache so each test starts fresh. */
export function clearPsgcCache(): void {
  cache.clear();
}

/**
 * Lazy-load one region's province → city → barangay tree.
 *
 * Behaviour:
 *  - Validates `regionValue` against the canonical `PH_REGIONS` list; throws
 *    `PsgcLoadError` if it isn't one of the 17.
 *  - On cache hit returns the same promise (no second fetch).
 *  - On cache miss fetches `/data/psgc/<region>.json`. If the network fails or
 *    the server responds non-2xx, throws `PsgcLoadError`. The promise is
 *    removed from the cache so a subsequent call can retry.
 *  - `fetchImpl` is injectable for tests; defaults to the global `fetch`.
 */
export function loadRegion(
  regionValue: string,
  fetchImpl: typeof fetch = fetch
): Promise<PsgcRegion> {
  const isValid = PH_REGIONS.some((r) => r.value === regionValue);
  if (!isValid) {
    return Promise.reject(
      new PsgcLoadError(`Unknown region: ${regionValue}`, regionValue)
    );
  }

  const cached = cache.get(regionValue);
  if (cached) return cached;

  const promise = (async () => {
    let res: Response;
    try {
      res = await fetchImpl(`/data/psgc/${regionValue}.json`);
    } catch (e) {
      throw new PsgcLoadError(
        `Failed to fetch region ${regionValue}: ${(e as Error).message}`,
        regionValue
      );
    }
    if (!res.ok) {
      throw new PsgcLoadError(
        `Region ${regionValue} responded ${res.status}`,
        regionValue
      );
    }
    return (await res.json()) as PsgcRegion;
  })();

  // Wrap so that any rejection clears the cache, allowing the caller to retry.
  const guarded = promise.catch((e) => {
    cache.delete(regionValue);
    throw e;
  });

  cache.set(regionValue, guarded);
  return guarded;
}
