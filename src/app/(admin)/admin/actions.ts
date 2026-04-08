"use server";

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

// ── Validation Schemas ──

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

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
      ? z.array(productSpecSchema).max(20).parse(JSON.parse(specsJson))
      : [];
    const compatibleCrops = cropsJson
      ? z.array(z.string().trim().min(1).max(100)).max(50).parse(JSON.parse(cropsJson))
      : [];

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
      const ext = imageFile.name.split(".").pop() || "jpg";
      const blob = await put(`products/${slug}-${Date.now()}.${ext}`, imageFile, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: imageFile.type,
      });
      imageUrl = blob.url;
    }

    const newProduct: AdminProduct = {
      id: crypto.randomUUID(),
      slug,
      name,
      description,
      image: imageUrl,
      categorySlug,
      visible: true,
      specs,
      howToApply,
      compatibleCrops,
      safetyNotes,
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
      const ext = thumbnailFile.name.split(".").pop() || "webp";
      const blob = await put(`videos/${slug}.${ext}`, thumbnailFile, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: thumbnailFile.type,
      });
      thumbnailUrl = blob.url;
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
