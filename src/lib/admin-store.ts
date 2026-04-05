import { put, get } from "@vercel/blob";

const CONFIG_PATH = "admin/config.json";

export interface AdminConfig {
  /** Optimistic lock — incremented on each save to detect concurrent writes */
  version: number;
  /** Product slugs that are hidden from the storefront */
  hiddenProducts: string[];
  /** Video list — if set, overrides the default static list */
  videos: AdminVideo[] | null;
  /** Admin-created products */
  customProducts: AdminProduct[] | null;
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
  specs?: AdminProductSpec[];
  howToApply?: string | null;
  compatibleCrops?: string[];
  safetyNotes?: string | null;
}

const DEFAULT_CONFIG: AdminConfig = {
  version: 0,
  hiddenProducts: [],
  videos: null,
  customProducts: null,
};

/**
 * Read admin config from Blob.
 * - Default mode: returns DEFAULT_CONFIG on any error (safe for page rendering).
 * - strict mode: throws on error (use in mutations to prevent overwriting with empty config).
 */
export async function getAdminConfig(
  opts: { strict?: boolean } = {}
): Promise<AdminConfig> {
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
