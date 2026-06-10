"use server";

import "@/lib/zod-config"; // CSP: disable Zod JIT before any z.object() (no unsafe-eval)
import { auth } from "@/auth";
import {
  getAdminConfig,
  saveAdminConfig,
  type AdminVideo,
  type AdminProduct,
} from "@/lib/admin-store";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { priceTierSchema } from "@/lib/price-tiers";

// ── Validation Schemas ──

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
/**
 * MIME type → fixed file extension. This is the SINGLE source of truth for
 * allowed image types AND their on-disk extension. The blob key extension is
 * derived from the validated `file.type` via this map — NEVER from the
 * attacker-controlled `file.name`, which can contain path-traversal sequences
 * (e.g. `x.jpg/../../admin/config.json`) that escape the `products/` prefix.
 */
const IMAGE_TYPE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const ALLOWED_IMAGE_TYPES = Object.keys(IMAGE_TYPE_EXT);

/**
 * Return the safe, whitelisted extension for an already-validated image file.
 * `validateImageFile` must run first; this throws if the type is somehow not in
 * the map (defense-in-depth — should be unreachable after validation).
 */
function safeImageExt(file: File): string {
  const ext = IMAGE_TYPE_EXT[file.type];
  if (!ext) {
    throw new Error(
      "Only JPEG, PNG, WebP, AVIF, and GIF images are allowed."
    );
  }
  return ext;
}

const productSpecSchema = z.object({
  label: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(500),
});

const videoSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().trim().min(1).max(200),
  href: z.string().url().refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Only http/https URLs are allowed" }
  ),
  thumbnail: z.string().min(1).max(500),
  visible: z.boolean(),
});

/** Max raw length for a JSON form field before parsing (DoS guard). */
const MAX_JSON_FIELD_CHARS = 20_000;

/**
 * Parse a JSON form field after capping its raw length, so a multi-MB string
 * can't spike memory before the downstream Zod `.max()` runs.
 */
function parseJsonField(raw: string): unknown {
  if (raw.length > MAX_JSON_FIELD_CHARS) {
    throw new Error("Input too large.");
  }
  return JSON.parse(raw);
}

/**
 * Parse the OPTIONAL English prose fields shared by addProduct/updateProduct.
 * Each field is independent and may be blank — a blank English field is stored
 * as `undefined` so it is OMITTED from the AdminProduct JSON, letting the
 * storefront fall back to the Filipino value per-field. Parsed with the same
 * Zod limits as the Filipino base fields.
 */
function parseEnglishProseFields(formData: FormData): {
  descriptionEn?: string;
  specsEn?: { label: string; value: string }[];
  howToApplyEn?: string | null;
  compatibleCropsEn?: string[];
  safetyNotesEn?: string | null;
} {
  const descriptionRaw = z.string().trim().max(2000).optional()
    .parse(formData.get("descriptionEn") ?? undefined);
  const descriptionEn = descriptionRaw && descriptionRaw.length > 0 ? descriptionRaw : undefined;

  const howToApplyEn = z.string().trim().max(2000).optional().nullable()
    .transform((v) => v || null)
    .parse(formData.get("howToApplyEn") || null) ?? null;

  const safetyNotesEn = z.string().trim().max(2000).optional().nullable()
    .transform((v) => v || null)
    .parse(formData.get("safetyNotesEn") || null) ?? null;

  const specsJson = formData.get("specsEn") as string | null;
  const specsParsed = specsJson
    ? z.array(productSpecSchema).max(20).parse(parseJsonField(specsJson))
    : [];
  const specsEn = specsParsed.length > 0 ? specsParsed : undefined;

  const cropsJson = formData.get("compatibleCropsEn") as string | null;
  const cropsParsed = cropsJson
    ? z.array(z.string().trim().min(1).max(100)).max(50).parse(parseJsonField(cropsJson))
    : [];
  const compatibleCropsEn = cropsParsed.length > 0 ? cropsParsed : undefined;

  return {
    descriptionEn,
    specsEn,
    // Null ⇒ omit (storefront falls back to Filipino). Keep as null only when
    // explicitly empty so the spread below drops it.
    howToApplyEn: howToApplyEn ?? undefined,
    compatibleCropsEn,
    safetyNotesEn: safetyNotesEn ?? undefined,
  };
}

function validateImageFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be under 5MB.");
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Only JPEG, PNG, WebP, AVIF, and GIF images are allowed."
    );
  }
}

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.role) throw new Error("Unauthorized");
  return session;
}

async function requireOwner() {
  const session = await requireAuth();
  if (session.user.role !== "owner") {
    throw new Error("Only the owner can perform this action.");
  }
  return session;
}

/** Revalidate all pages that read admin config */
function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/products");
}

// ── Product Seeding ──

/** Seed the 4 built-in products into customProducts if they don't exist yet */
export async function seedBuiltInProducts() {
  await requireAuth();
  try {
    const { products: builtInProducts, localizeProduct } = await import(
      "@/data/products"
    );
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    const existingSlugs = new Set(
      (config.customProducts ?? []).map((p) => p.slug)
    );

    // AdminProduct now carries BOTH languages: the base fields hold Filipino
    // (the live default) and the `*En` fields hold English. Seeding resolves
    // the bilingual source once per language so the owner gets instant
    // bilingual content for the 4 built-in products on (re-)seed.
    const newProducts: AdminProduct[] = builtInProducts
      .filter((p) => !existingSlugs.has(p.slug))
      .map((source) => {
        const fil = localizeProduct(source, "fil");
        const en = localizeProduct(source, "en");
        return {
          id: crypto.randomUUID(),
          slug: fil.slug,
          name: fil.name,
          description: fil.oneLiner,
          image: fil.image,
          categorySlug: fil.categorySlug,
          visible: true,
          priceCentavos: fil.priceCentavos,
          priceTiers: fil.priceTiers,
          specs: fil.specs,
          howToApply: fil.howToApply,
          compatibleCrops: fil.compatibleCrops,
          safetyNotes: fil.safetyNotes,
          // English counterparts — fall back to Filipino on the storefront if
          // ever absent, but seeding always supplies both.
          descriptionEn: en.oneLiner,
          specsEn: en.specs,
          howToApplyEn: en.howToApply,
          compatibleCropsEn: en.compatibleCrops,
          safetyNotesEn: en.safetyNotes,
        };
      });

    if (newProducts.length === 0) return;

    config.customProducts = [
      ...newProducts,
      ...(config.customProducts ?? []),
    ];
    // Clear the built-in hidden list since they're now custom
    config.hiddenProducts = [];
    await saveAdminConfig(config, ver);
    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("seedBuiltInProducts failed:", e);
    throw new Error("Failed to seed products. Please try again.");
  }
}

// ── Products ──

export async function toggleProductVisibility(slug: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.hiddenProducts.includes(slug)) {
      config.hiddenProducts = config.hiddenProducts.filter((s) => s !== slug);
    } else {
      config.hiddenProducts.push(slug);
    }

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("toggleProductVisibility failed:", e);
    throw new Error("Failed to toggle product visibility. Please try again.");
  }
}

export async function addProduct(formData: FormData) {
  await requireAuth();

  try {
    const name = z.string().trim().min(1, "Name is required").max(200).parse(formData.get("name"));
    const description = z.string().trim().min(1, "Description is required").max(2000).parse(formData.get("description"));
    const categorySlug = z.string().trim().min(1, "Category is required").max(100).parse(formData.get("categorySlug"));
    const imageFile = formData.get("image") as File;
    const howToApply = z.string().trim().max(2000).optional().nullable()
      .transform((v) => v || null)
      .parse(formData.get("howToApply") || null);
    const safetyNotes = z.string().trim().max(2000).optional().nullable()
      .transform((v) => v || null)
      .parse(formData.get("safetyNotes") || null);
    const specsJson = formData.get("specs") as string | null;
    const cropsJson = formData.get("compatibleCrops") as string | null;

    const specs = specsJson
      ? z.array(productSpecSchema).max(20).parse(parseJsonField(specsJson))
      : [];
    const compatibleCrops = cropsJson
      ? z.array(z.string().trim().min(1).max(100)).max(50).parse(parseJsonField(cropsJson))
      : [];

    // English counterparts (all optional — blank ⇒ falls back to Filipino on
    // the storefront). Parsed identically to the base fields.
    const en = parseEnglishProseFields(formData);

    const tiersJson = formData.get("priceTiers") as string | null;
    const priceTiers = tiersJson
      ? priceTierSchema.parse(parseJsonField(tiersJson))
      : undefined;

    const priceRaw = formData.get("price");
    const priceCentavos =
      priceRaw === null || String(priceRaw).trim() === ""
        ? undefined
        : z
            .number()
            .nonnegative()
            .int()
            .parse(Math.round(Number(priceRaw) * 100));

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) {
      throw new Error("Product name must contain at least one letter or number.");
    }

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;
    const existingSlugs = (config.customProducts ?? []).map((p) => p.slug);
    if (existingSlugs.includes(slug)) {
      throw new Error(`A product with a similar name already exists (slug: ${slug}).`);
    }

    // Upload image to Vercel Blob
    let imageUrl = "/images/NewLogo.png"; // fallback
    if (imageFile && imageFile.size > 0) {
      validateImageFile(imageFile);
      const ext = safeImageExt(imageFile);
      const blob = await put(`products/${slug}-${Date.now()}.${ext}`, imageFile, {
        access: "private",
        addRandomSuffix: true,
        contentType: imageFile.type,
      });
      imageUrl = `/api/blob-image?url=${encodeURIComponent(blob.url)}`;
    }

    const newProduct: AdminProduct = {
      id: crypto.randomUUID(),
      slug,
      name,
      description,
      image: imageUrl,
      categorySlug,
      visible: true,
      priceCentavos,
      // Absent/empty priceTiers intentionally CLEARS the ladder — the edit form must always resubmit current tiers.
      priceTiers: priceTiers && priceTiers.length > 0 ? priceTiers : undefined,
      specs,
      howToApply,
      compatibleCrops,
      safetyNotes,
      // Optional English fields — undefined keys are omitted from the JSON.
      ...en,
    };

    config.customProducts = [...(config.customProducts ?? []), newProduct];
    await saveAdminConfig(config, ver);

    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("addProduct failed:", e);
    throw new Error("Failed to add product. Please try again.");
  }
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAuth();

  try {
    const name = z.string().trim().min(1).max(200).parse(formData.get("name"));
    const description = z.string().trim().min(1).max(2000).parse(formData.get("description"));
    const categorySlug = z.string().trim().min(1).max(100).parse(formData.get("categorySlug"));
    const imageFile = formData.get("image") as File | null;
    const howToApply = z.string().trim().max(2000).optional().nullable()
      .transform((v) => v || null)
      .parse(formData.get("howToApply") || null);
    const safetyNotes = z.string().trim().max(2000).optional().nullable()
      .transform((v) => v || null)
      .parse(formData.get("safetyNotes") || null);
    const specsJson = formData.get("specs") as string | null;
    const cropsJson = formData.get("compatibleCrops") as string | null;

    const specs = specsJson
      ? z.array(productSpecSchema).max(20).parse(parseJsonField(specsJson))
      : [];
    const compatibleCrops = cropsJson
      ? z.array(z.string().trim().min(1).max(100)).max(50).parse(parseJsonField(cropsJson))
      : [];

    // English counterparts (optional; blank ⇒ omitted ⇒ storefront falls back
    // to Filipino). The edit form always resubmits these, so a blanked English
    // field clears the stored value — mirroring how base fields behave.
    const en = parseEnglishProseFields(formData);

    const tiersJson = formData.get("priceTiers") as string | null;
    const priceTiers = tiersJson
      ? priceTierSchema.parse(parseJsonField(tiersJson))
      : undefined;

    const priceRaw = formData.get("price");
    const priceCentavos =
      priceRaw === null || String(priceRaw).trim() === ""
        ? undefined
        : z
            .number()
            .nonnegative()
            .int()
            .parse(Math.round(Number(priceRaw) * 100));

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    const idx = (config.customProducts ?? []).findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");

    const existing = config.customProducts![idx];

    // Re-derive slug from new name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!slug) throw new Error("Product name must contain at least one letter or number.");

    // Check slug uniqueness (excluding this product)
    const otherSlugs = config.customProducts!
      .filter((p) => p.id !== id)
      .map((p) => p.slug);
    if (otherSlugs.includes(slug)) {
      throw new Error(`A product with a similar name already exists (slug: ${slug}).`);
    }

    // Upload new image if provided, otherwise keep existing
    let imageUrl = existing.image;
    if (imageFile && imageFile.size > 0) {
      validateImageFile(imageFile);
      const ext = safeImageExt(imageFile);
      const blob = await put(`products/${slug}-${Date.now()}.${ext}`, imageFile, {
        access: "private",
        addRandomSuffix: true,
        contentType: imageFile.type,
      });
      imageUrl = `/api/blob-image?url=${encodeURIComponent(blob.url)}`;
    }

    config.customProducts![idx] = {
      ...existing,
      slug,
      name,
      description,
      image: imageUrl,
      categorySlug,
      priceCentavos,
      // Absent/empty priceTiers intentionally CLEARS the ladder — the edit form must always resubmit current tiers.
      priceTiers: priceTiers && priceTiers.length > 0 ? priceTiers : undefined,
      specs,
      howToApply,
      compatibleCrops,
      safetyNotes,
      // English fields: the edit form always resubmits them, so a blanked field
      // (parsed to undefined) explicitly CLEARS the stored value rather than
      // leaving the stale `...existing` value behind.
      descriptionEn: en.descriptionEn,
      specsEn: en.specsEn,
      howToApplyEn: en.howToApplyEn,
      compatibleCropsEn: en.compatibleCropsEn,
      safetyNotesEn: en.safetyNotesEn,
    };

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("updateProduct failed:", e);
    if (e instanceof Error && e.message.includes("already exists")) throw e;
    throw new Error("Failed to update product. Please try again.");
  }
}

export async function removeProduct(id: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.customProducts) {
      config.customProducts = config.customProducts.filter((p) => p.id !== id);
      await saveAdminConfig(config, ver);
    }

    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("removeProduct failed:", e);
    throw new Error("Failed to remove product. Please try again.");
  }
}

export async function toggleCustomProductVisibility(id: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.customProducts) {
      config.customProducts = config.customProducts.map((p) =>
        p.id === id ? { ...p, visible: !p.visible } : p
      );
      await saveAdminConfig(config, ver);
    }

    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("toggleCustomProductVisibility failed:", e);
    throw new Error("Failed to toggle product visibility. Please try again.");
  }
}

// ── Featured Products ──

export async function toggleFeaturedProduct(id: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.featuredProductIds.includes(id)) {
      config.featuredProductIds = config.featuredProductIds.filter((fid) => fid !== id);
    } else {
      config.featuredProductIds = [...config.featuredProductIds, id];
    }

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("toggleFeaturedProduct failed:", e);
    throw new Error("Failed to update featured products. Please try again.");
  }
}

// Cap the client-supplied ordering: IDs are short (~36-char UUIDs), so
// reject oversized strings/arrays rather than persisting them to the
// config Blob that every storefront render reads.
const featuredOrderSchema = z.array(z.string().min(1).max(100)).max(50);

export async function saveFeaturedOrder(orderedIds: string[]) {
  await requireAuth();
  try {
    const ids = featuredOrderSchema.parse(orderedIds);

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    // Keep only known product IDs and dedupe — silently dropping unknown IDs
    // mirrors the storefront's .filter(Boolean) behaviour so stale reorders
    // don't break, while preventing junk from polluting the persisted config.
    const known = new Set((config.customProducts ?? []).map((p) => p.id));
    config.featuredProductIds = [...new Set(ids.filter((id) => known.has(id)))];

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/products");
    revalidateStorefront();
  } catch (e) {
    console.error("saveFeaturedOrder failed:", e);
    throw new Error("Failed to reorder featured products. Please try again.");
  }
}

// ── Videos ──

export async function saveVideos(videos: AdminVideo[]) {
  await requireAuth();
  try {
    // Validate and strip to known fields only (prevents mass assignment)
    const validated = z.array(videoSchema).max(100).parse(videos);

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;
    config.videos = validated;
    await saveAdminConfig(config, ver);
    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("saveVideos failed:", e);
    throw new Error("Failed to save videos. Please try again.");
  }
}

export async function addVideo(formData: FormData) {
  await requireAuth();

  try {
    const title = z.string().trim().min(1, "Title is required").max(200).parse(formData.get("title"));
    const href = z.string().url("Please enter a valid URL").refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return ["http:", "https:"].includes(parsed.protocol);
        } catch {
          return false;
        }
      },
      { message: "Only http/https URLs are allowed" }
    ).parse(formData.get("href"));
    const thumbnailFile = formData.get("thumbnail") as File;

    // Upload thumbnail to Vercel Blob
    let thumbnailUrl = "/images/NewLogo.png";
    if (thumbnailFile && thumbnailFile.size > 0) {
      validateImageFile(thumbnailFile);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const ext = safeImageExt(thumbnailFile);
      const blob = await put(`videos/${slug}.${ext}`, thumbnailFile, {
        access: "private",
        addRandomSuffix: true,
        contentType: thumbnailFile.type,
      });
      thumbnailUrl = `/api/blob-image?url=${encodeURIComponent(blob.url)}`;
    }

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    const newVideo: AdminVideo = {
      id: crypto.randomUUID(),
      title,
      href,
      thumbnail: thumbnailUrl,
      visible: true,
    };

    if (!config.videos) {
      config.videos = [newVideo];
    } else {
      config.videos.push(newVideo);
    }

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("addVideo failed:", e);
    throw new Error("Failed to add video. Please try again.");
  }
}

export async function removeVideo(id: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.videos) {
      config.videos = config.videos.filter((v) => v.id !== id);
      await saveAdminConfig(config, ver);
    }

    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("removeVideo failed:", e);
    throw new Error("Failed to remove video. Please try again.");
  }
}

export async function toggleVideoVisibility(id: string) {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (config.videos) {
      config.videos = config.videos.map((v) =>
        v.id === id ? { ...v, visible: !v.visible } : v
      );
      await saveAdminConfig(config, ver);
    }

    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("toggleVideoVisibility failed:", e);
    throw new Error("Failed to toggle video visibility. Please try again.");
  }
}

export async function moveVideo(id: string, direction: "up" | "down") {
  await requireAuth();
  try {
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    if (!config.videos) return;

    const idx = config.videos.findIndex((v) => v.id === id);
    if (idx === -1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= config.videos.length) return;

    // Swap
    [config.videos[idx], config.videos[targetIdx]] = [
      config.videos[targetIdx],
      config.videos[idx],
    ];

    await saveAdminConfig(config, ver);
    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("moveVideo failed:", e);
    throw new Error("Failed to reorder video. Please try again.");
  }
}

// ── Team Management (Owner only) ──

export async function addManager(email: string) {
  await requireOwner();
  try {
    const validated = z.string().email().toLowerCase().parse(email.trim());

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    // Check not already a manager
    if (config.managers.map((e) => e.toLowerCase()).includes(validated)) {
      throw new Error("This email is already a manager.");
    }

    // Check not an owner
    const { getOwnerEmails } = await import("@/lib/admin-store");
    if (getOwnerEmails().includes(validated)) {
      throw new Error("This email is already an owner.");
    }

    config.managers = [...config.managers, validated];
    await saveAdminConfig(config, ver);
    revalidatePath("/admin/team");
  } catch (e) {
    console.error("addManager failed:", e);
    if (e instanceof Error && (e.message.includes("already") || e.message.includes("owner"))) {
      throw e;
    }
    throw new Error("Failed to add manager. Please try again.");
  }
}

export async function removeManager(email: string) {
  await requireOwner();
  try {
    const validated = z.string().email().toLowerCase().parse(email.trim());

    const config = await getAdminConfig({ strict: true });
    const ver = config.version;

    config.managers = config.managers.filter(
      (e) => e.toLowerCase() !== validated
    );
    await saveAdminConfig(config, ver);
    revalidatePath("/admin/team");
  } catch (e) {
    console.error("removeManager failed:", e);
    throw new Error("Failed to remove manager. Please try again.");
  }
}

// ── Shipping ──

// Per-region shipping fee ceiling: ₱10,000 (1,000,000 centavos). Real J&T
// nationwide fees sit far below this; the cap is defense-in-depth against a
// fat-fingered or tampered owner submission setting an absurd customer-facing
// fee. Generous headroom so legitimate provincial rates never hit it.
const MAX_SHIPPING_FEE_CENTAVOS = 1_000_000;
const shippingFeeCentavos = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_SHIPPING_FEE_CENTAVOS);
const shippingSchema = z.object({
  enabled: z.boolean(),
  feesCentavos: z.object({
    ncr: shippingFeeCentavos,
    luzon: shippingFeeCentavos,
    visayas: shippingFeeCentavos,
    mindanao: shippingFeeCentavos,
  }),
});

export async function saveShippingConfig(input: z.infer<typeof shippingSchema>) {
  // Owner-only: shipping fees are a customer-facing financial control.
  await requireOwner();
  try {
    const validated = shippingSchema.parse(input);
    const config = await getAdminConfig({ strict: true });
    const ver = config.version;
    config.shipping = validated;
    await saveAdminConfig(config, ver);
    revalidatePath("/admin/shipping");
  } catch (e) {
    console.error("saveShippingConfig failed:", e);
    throw new Error("Failed to save shipping settings. Please try again.");
  }
}
