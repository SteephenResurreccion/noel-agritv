import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { put, get } from "@vercel/blob";
import type { PriceTier } from "@/lib/pricing";

const CONFIG_PATH = "admin/config.json";

/**
 * Next Data-Cache tag for the admin config. Every successful `saveAdminConfig`
 * invalidates this tag, so the cross-request cached render read (below) picks up
 * the new config on the very next storefront render.
 */
const ADMIN_CONFIG_TAG = "admin-config";

export type AdminRole = "owner" | "manager";

export interface AdminConfig {
  /** Optimistic lock — incremented on each save to detect concurrent writes */
  version: number;
  /** Product slugs that are hidden from the storefront */
  hiddenProducts: string[];
  /** Video list — if set, overrides the default static list */
  videos: AdminVideo[] | null;
  /** Admin-created products */
  customProducts: AdminProduct[] | null;
  /** Ordered list of product IDs to feature on the homepage "Top Picks" */
  featuredProductIds: string[];
  /** Manager emails — these users can manage products/videos but not team */
  managers: string[];
  /** Shipping estimate settings (default OFF). */
  shipping: ShippingConfig;
}

/**
 * Admin-editable shipping settings.
 * `enabled` toggles the estimate at checkout; `feesCentavos` holds per-zone fees
 * keyed by the fixed PH_REGIONS zone mapping (`src/lib/ph-regions.ts`).
 */
export interface ShippingConfig {
  enabled: boolean;
  feesCentavos: {
    ncr: number;
    luzon: number;
    visayas: number;
    mindanao: number;
  };
}

export interface AdminVideo {
  id: string;
  title: string;
  href: string;
  thumbnail: string;
  visible: boolean;
}

export interface AdminProductSpec {
  label: string;
  value: string;
}

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  categorySlug: string;
  visible: boolean;
  priceCentavos?: number; // integer centavos; optional
  priceTiers?: PriceTier[];
  specs?: AdminProductSpec[];
  howToApply?: string | null;
  compatibleCrops?: string[];
  safetyNotes?: string | null;
  /**
   * Optional English counterparts of every prose field. The non-`En` fields
   * above hold the Filipino text (the live, default language). These `En`
   * fields are ADDITIVE and OPTIONAL — old Blob records that predate bilingual
   * support simply omit them and keep working unchanged. When the storefront
   * resolves a product for English, each `En` field falls back INDEPENDENTLY
   * to its Filipino counterpart if absent (see `adminToProduct`). There is no
   * `oneLinerEn` because oneLiner is derived from `description`, not stored.
   */
  descriptionEn?: string;
  specsEn?: AdminProductSpec[];
  howToApplyEn?: string | null;
  compatibleCropsEn?: string[];
  safetyNotesEn?: string | null;
}

const DEFAULT_CONFIG: AdminConfig = {
  version: 0,
  hiddenProducts: [],
  videos: null,
  customProducts: null,
  featuredProductIds: [],
  managers: [],
  shipping: {
    enabled: false,
    feesCentavos: { ncr: 0, luzon: 0, visayas: 0, mindanao: 0 },
  },
};

/**
 * Raw origin Blob read of the admin config. ALWAYS a fresh fetch.
 *
 * THROWS on any Blob/parse failure; a genuine not-found (no Blob object yet)
 * resolves to DEFAULT_CONFIG, a valid and cacheable empty state. This is the
 * shared core for BOTH read paths below, and its throw-on-failure shape is
 * load-bearing for the cached path: a rejected promise is NEVER written to the
 * Data Cache, so a transient Blob blip can't poison every instance with
 * DEFAULT_CONFIG for the cache lifetime. The merge over DEFAULT_CONFIG happens
 * HERE (pre-cache), so deserialized cache hits remain fully shaped.
 *
 * Callers MUST go through `getAdminConfig` (below), not this fn directly.
 */
async function fetchConfigFromOrigin(): Promise<AdminConfig> {
  const result = await get(CONFIG_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result) return DEFAULT_CONFIG;

  const text = await new Response(result.stream).text();
  const data = JSON.parse(text);
  return { ...DEFAULT_CONFIG, ...data };
}

/**
 * Strict read path: a fresh origin fetch every call, propagating failure.
 *
 * Mutations call this twice per request — once before mutating and once inside
 * `saveAdminConfig`'s optimistic-lock re-read — and BOTH must see the live Blob
 * version, or concurrent-write detection silently fails. `resolveRoleStrict`
 * likewise needs origin-fresh manager auth. This path NEVER touches the
 * cross-request Data Cache below.
 */
async function readConfigStrict(): Promise<AdminConfig> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN not configured");
  }
  return fetchConfigFromOrigin();
}

/**
 * Cross-request Data Cache wrapper for the NON-STRICT (render) read.
 *
 * Every storefront render reads the admin config; without this, each render paid
 * one Vercel Blob round-trip. `unstable_cache` persists the result across
 * requests AND deployments, so the Blob is hit at most once per `revalidate`
 * window (or until `revalidateTag(ADMIN_CONFIG_TAG)` fires on a save) — not once
 * per render.
 *
 * Legacy-API note: Next 16 marks `unstable_cache` as superseded by the `use
 * cache` directive, which requires opting into Cache Components. We deliberately
 * stay on `unstable_cache` (no Cache Components) to keep this a narrow data-layer
 * change: the storefront HTML stays fully dynamic (per-request nonce CSP +
 * `naf_lang` cookie reads in layouts), so only the Blob READ is cached, never
 * the rendered page.
 *
 * The wrapped fn is `fetchConfigFromOrigin`, which THROWS on failure — so the
 * token short-circuit and error fallback live OUTSIDE this wrapper (see
 * `getCachedConfig`), keeping DEFAULT_CONFIG out of the cache.
 */
const readConfigCached = unstable_cache(
  fetchConfigFromOrigin,
  ["admin-config-v1"],
  { tags: [ADMIN_CONFIG_TAG], revalidate: 300 }
);

/**
 * Request-scoped memo over the cross-request Data Cache.
 *
 * React's `cache` dedupes within a single render so the 3-4 config reads one
 * page render fires collapse into ONE Data-Cache lookup. The token short-circuit
 * and the error catch live HERE (outside `readConfigCached`): a missing token or
 * a transient Blob failure returns DEFAULT_CONFIG WITHOUT caching it.
 *
 * IMPORTANT: the returned object is a SHARED reference for the request (and may
 * be shared across requests via the Data Cache). Treat it as READ-ONLY. All
 * current render callers only read it (filter/find/map → new arrays), which is
 * safe. Mutators must use `getAdminConfig({ strict: true })`, which is NEVER
 * cached and returns a fresh object every call.
 */
const getCachedConfig = cache(async (): Promise<AdminConfig> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return DEFAULT_CONFIG;
  try {
    return await readConfigCached();
  } catch (e) {
    console.error("Failed to read admin config:", e);
    return DEFAULT_CONFIG;
  }
});

/**
 * Read admin config.
 * - Default (non-strict, render) reads go through the cross-request Data Cache
 *   (`unstable_cache`) plus a per-request React `cache` memo on top — one Blob
 *   fetch per cache window, shared read-only object.
 * - strict reads are ALWAYS a fresh origin fetch (see `readConfigStrict`), never
 *   cached, so optimistic locking and manager auth see the live Blob version.
 */
export async function getAdminConfig(
  opts: { strict?: boolean } = {}
): Promise<AdminConfig> {
  if (opts.strict) return readConfigStrict();
  return getCachedConfig();
}

/**
 * Save admin config with optimistic locking.
 * Pass expectedVersion (from the config you read) to detect concurrent writes.
 * If another save happened in between, this throws to prevent data loss.
 */
/** Get owner emails from env var */
export function getOwnerEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Strict role resolution — the canonical resolver.
 *
 * - Owners come from env (ADMIN_EMAILS) and are resolved BEFORE any Blob read,
 *   so a Blob outage can never lock the owner out (no Blob is touched for them).
 * - Managers are resolved from a STRICT admin-config read that PROPAGATES on a
 *   Blob outage: it REJECTS rather than swallowing the error. A transient blip
 *   therefore surfaces to the caller (`resolveRoleWithRetry`), which can retry
 *   and, failing that, preserve a prior successfully-read role.
 * - On a SUCCESSFUL read: returns "manager" if the email is configured, else
 *   `null`. A successful `null` is a real de-authorization (revoked manager) —
 *   it is NOT an outage and must clear the role.
 *
 * Never invents, defaults, or widens a role.
 */
export async function resolveRoleStrict(
  email: string
): Promise<AdminRole | null> {
  const normalized = email.toLowerCase();

  const owners = getOwnerEmails();
  if (owners.includes(normalized)) return "owner";

  // Strict read: a Blob outage propagates as a rejection (not swallowed) so the
  // caller can distinguish "read failed" from "read succeeded, not a manager".
  const config = await getAdminConfig({ strict: true });
  if (config.managers.map((e) => e.toLowerCase()).includes(normalized)) {
    return "manager";
  }
  return null;
}

/**
 * Sign-in-gate role resolution. Thin wrapper over `resolveRoleStrict` that
 * SWALLOWS a Blob outage: on failure it logs and denies (returns `null`) rather
 * than rejecting. Used by the Auth.js `signIn` callback, which only needs a
 * yes/no gate and must fail closed (deny) on an outage without surfacing a
 * thrown error. The owner env short-circuit inside `resolveRoleStrict` still
 * runs first, so an outage never locks an owner out at sign-in.
 */
export async function resolveRole(
  email: string
): Promise<AdminRole | null> {
  try {
    return await resolveRoleStrict(email);
  } catch (e) {
    console.error("resolveRole: strict admin-config read failed:", e);
    return null;
  }
}

export async function saveAdminConfig(
  config: AdminConfig,
  expectedVersion?: number
): Promise<void> {
  if (expectedVersion !== undefined) {
    // Re-read to check version hasn't changed
    const current = await getAdminConfig({ strict: true });
    if (current.version !== expectedVersion) {
      throw new Error(
        "Config was modified by another request. Please refresh and try again."
      );
    }
  }
  config.version = (config.version ?? 0) + 1;
  await put(CONFIG_PATH, JSON.stringify(config, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });

  // Invalidate the cross-request Data Cache so the next render reads the fresh
  // config, not the stale cached copy. This funnels through saveAdminConfig, so
  // EVERY mutation (products, videos, team, shipping) busts the cache instantly.
  //
  // `{ expire: 0 }` = immediate expiration: the next non-strict read is a
  // blocking cache miss → fresh Blob, AND Next marks the path as revalidated, so
  // an admin sees their OWN write on the very next render (read-your-own-write).
  // `profile: "max"` is rejected here — it is stale-while-revalidate and would
  // serve the admin the OLD config once more after saving. The single-arg
  // `revalidateTag(tag)` form is deprecated in Next 16 (and TS-errors); the
  // two-arg `{ expire: 0 }` is its supported equivalent. Runs AFTER a successful
  // put only — a failed write throws above and never reaches here, so the cache
  // is never invalidated without an actual change landing.
  revalidateTag(ADMIN_CONFIG_TAG, { expire: 0 });
}
