import { put, get } from "@vercel/blob";

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
    const result = await get(CONFIG_PATH, {
      access: "private",
      useCache: false,
    });
    if (!result) return DEFAULT_CONFIG;

    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
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
    allowOverwrite: true,
    contentType: "application/json",
  });
}
