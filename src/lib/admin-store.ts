import { put, list } from "@vercel/blob";

const CONFIG_PATH = "admin/config.json";

export interface AdminConfig {
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

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  categorySlug: string;
  visible: boolean;
}

const DEFAULT_CONFIG: AdminConfig = {
  hiddenProducts: [],
  videos: null,
  customProducts: null,
};

export async function getAdminConfig(): Promise<AdminConfig> {
  try {
    // List blobs to find config file
    const { blobs } = await list({ prefix: CONFIG_PATH, limit: 1 });
    if (blobs.length === 0) return DEFAULT_CONFIG;

    // Fetch with token for private store
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const res = await fetch(blobs[0].url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    });
    if (!res.ok) return DEFAULT_CONFIG;
    const data = await res.json();
    return { ...DEFAULT_CONFIG, ...data };
  } catch (e) {
    console.error("Failed to read admin config:", e);
    return DEFAULT_CONFIG;
  }
}

export async function saveAdminConfig(config: AdminConfig): Promise<void> {
  await put(CONFIG_PATH, JSON.stringify(config, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
