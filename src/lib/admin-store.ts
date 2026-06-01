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
 * Read admin config from Blob.
 * - Default mode: returns DEFAULT_CONFIG on any error (safe for page rendering).
 * - strict mode: throws on error (use in mutations to prevent overwriting with empty config).
 */
export async function getAdminConfig(
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

/** Resolve an email to a role, or null if unauthorized */
export async function resolveRole(
  email: string
): Promise<AdminRole | null> {
  const normalized = email.toLowerCase();

  // Owners come from env (ADMIN_EMAILS) and are resolved BEFORE the Blob read,
  // so a Blob outage can never lock the owner out.
  const owners = getOwnerEmails();
  if (owners.includes(normalized)) return "owner";

  // Manager resolution uses a STRICT read: a Blob read error must NOT be
  // silently treated as "no managers" (which would also hide a real outage).
  // On failure we log and deny (return null) rather than trusting an empty
  // config. Owners are unaffected (already returned above).
  try {
    const config = await getAdminConfig({ strict: true });
    if (config.managers.map((e) => e.toLowerCase()).includes(normalized)) {
      return "manager";
    }
  } catch (e) {
    console.error("resolveRole: strict admin-config read failed:", e);
    return null;
  }
  return null;
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
