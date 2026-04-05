import { put, list } from "@vercel/blob";

const CONFIG_PATH = "admin/config.json";

export interface AdminConfig {
  /** Product slugs that are hidden from the storefront */
  hiddenProducts: string[];
  /** Video list — if set, overrides the default static list */
  videos: AdminVideo[] | null;
}

export interface AdminVideo {
  id: string;
  title: string;
  href: string;
  thumbnail: string;
  visible: boolean;
}

const DEFAULT_CONFIG: AdminConfig = {
  hiddenProducts: [],
  videos: null,
};

export async function getAdminConfig(): Promise<AdminConfig> {
  try {
    const { blobs } = await list({ prefix: CONFIG_PATH, limit: 1 });
    if (blobs.length === 0) return DEFAULT_CONFIG;
    const res = await fetch(blobs[0].url, { next: { revalidate: 30 } });
    if (!res.ok) return DEFAULT_CONFIG;
    const data = await res.json();
    return { ...DEFAULT_CONFIG, ...data };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveAdminConfig(config: AdminConfig): Promise<void> {
  await put(CONFIG_PATH, JSON.stringify(config, null, 2), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}
