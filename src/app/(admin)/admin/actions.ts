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

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
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
    const config = await getAdminConfig();

    if (config.hiddenProducts.includes(slug)) {
      config.hiddenProducts = config.hiddenProducts.filter((s) => s !== slug);
    } else {
      config.hiddenProducts.push(slug);
    }

    await saveAdminConfig(config);
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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const categorySlug = formData.get("categorySlug") as string;
    const imageFile = formData.get("image") as File;

    // Upload image to Vercel Blob
    let imageUrl = "/images/NewLogo.png"; // fallback
    if (imageFile && imageFile.size > 0) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const ext = imageFile.name.split(".").pop() || "jpg";
      const blob = await put(`products/${slug}.${ext}`, imageFile, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: imageFile.type,
      });
      imageUrl = `/api/blob-image?url=${encodeURIComponent(blob.url)}`;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newProduct: AdminProduct = {
      id: crypto.randomUUID(),
      slug,
      name,
      description,
      image: imageUrl,
      categorySlug,
      visible: true,
    };

    const config = await getAdminConfig();
    config.customProducts = [...(config.customProducts ?? []), newProduct];
    await saveAdminConfig(config);

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
    const config = await getAdminConfig();

    if (config.customProducts) {
      config.customProducts = config.customProducts.filter((p) => p.id !== id);
      await saveAdminConfig(config);
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
    const config = await getAdminConfig();

    if (config.customProducts) {
      config.customProducts = config.customProducts.map((p) =>
        p.id === id ? { ...p, visible: !p.visible } : p
      );
      await saveAdminConfig(config);
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
    const config = await getAdminConfig();
    config.videos = videos;
    await saveAdminConfig(config);
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
    const title = formData.get("title") as string;
    const href = formData.get("href") as string;
    const thumbnailFile = formData.get("thumbnail") as File;

    // Upload thumbnail to Vercel Blob
    let thumbnailUrl = "/images/NewLogo.png";
    if (thumbnailFile && thumbnailFile.size > 0) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const ext = thumbnailFile.name.split(".").pop() || "webp";
      const blob = await put(`videos/${slug}.${ext}`, thumbnailFile, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: thumbnailFile.type,
      });
      thumbnailUrl = `/api/blob-image?url=${encodeURIComponent(blob.url)}`;
    }

    const config = await getAdminConfig();

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

    await saveAdminConfig(config);
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
    const config = await getAdminConfig();

    if (config.videos) {
      config.videos = config.videos.filter((v) => v.id !== id);
      await saveAdminConfig(config);
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
    const config = await getAdminConfig();

    if (config.videos) {
      config.videos = config.videos.map((v) =>
        v.id === id ? { ...v, visible: !v.visible } : v
      );
      await saveAdminConfig(config);
    }

    revalidatePath("/admin/videos");
    revalidateStorefront();
  } catch (e) {
    console.error("toggleVideoVisibility failed:", e);
    throw new Error("Failed to toggle video visibility. Please try again.");
  }
}
