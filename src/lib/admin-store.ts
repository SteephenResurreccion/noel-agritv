import { cache } from "react";
import { put, get } from "@vercel/blob";
import type { PriceTier } from "@/lib/pricing";

const CONFIG_PATH = "admin/config.json";

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
 * Uncached Blob read of the admin config. Always performs a fresh origin fetch.
 * - Default mode: returns DEFAULT_CONFIG on any error (safe for page rendering).
 * - strict mode: throws on error (use in mutations to prevent overwriting with empty config).
 *
 * Callers MUST go through `getAdminConfig` (below), not this fn directly.
 */
async function readAdminConfig(
  opts: { strict?: boolean } = {}
): Promise<AdminConfig> {
  // If blob token isn't configured, skip blob entirely
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    if (opts.strict) throw new Error("BLOB_READ_WRITE_TOKEN not configured");
    return DEFAULT_CONFIG;
  }
  try {
    const result = await get(CONFIG_PATH, {
      access: "private",
      useCache: false,
    });
    if (!result) return DEFAULT_CONFIG;

    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return { ...DEFAULT_CONFIG, ...data };
  } catch (e) {
    if (opts.strict) {
      throw e; // Let mutation callers handle this — don't silently return empty config
    }
    console.error("Failed to read admin config:", e);
    return DEFAULT_CONFIG;
  }
}

/**
 * Request-scoped memo for the NON-STRICT (read-only render) path.
 *
 * React's `cache` dedupes within a single server render/request pass only — it
 * does NOT persist across requests, so admin saves + `revalidatePath` still take
 * effect on the very next request. This collapses the 3-4 identical Blob reads a
 * single product/storefront page render fires into ONE origin fetch.
 *
 * IMPORTANT: the returned object is a SHARED reference for the request. Treat it
 * as READ-ONLY. All current render callers only read it (filter/find/map →
 * new arrays), which is safe. Mutators must use `getAdminConfig({ strict: true })`,
 * which is NEVER memoized and returns a fresh object every call.
 */
const getCachedConfig = cache(() => readAdminConfig({}));

/**
 * Read admin config from Blob.
 * - Default (non-strict) reads are request-deduped via React `cache` (one Blob
 *   fetch per render, shared read-only object).
 * - strict reads are ALWAYS fresh (never memoized): mutations call this twice
 *   per request — once before mutating and once inside `saveAdminConfig`'s
 *   optimistic-lock re-read — and both MUST see the live Blob version, or
 *   concurrent-write detection silently fails. `resolveRoleStrict` likewise
 *   needs origin-fresh manager auth.
 */
export async function getAdminConfig(
  opts: { strict?: boolean } = {}
): Promise<AdminConfig> {
  if (opts.strict) return readAdminConfig({ strict: true });
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
}
