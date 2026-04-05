"use server";

import { auth } from "@/auth";
import {
  getAdminConfig,
  saveAdminConfig,
  type AdminVideo,
} from "@/lib/admin-store";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// ── Products ──

export async function toggleProductVisibility(slug: string) {
  await requireAuth();
  const config = await getAdminConfig();

  if (config.hiddenProducts.includes(slug)) {
    config.hiddenProducts = config.hiddenProducts.filter((s) => s !== slug);
  } else {
    config.hiddenProducts.push(slug);
  }

  await saveAdminConfig(config);
  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/products");
}

// ── Videos ──

export async function saveVideos(videos: AdminVideo[]) {
  await requireAuth();
  const config = await getAdminConfig();
  config.videos = videos;
  await saveAdminConfig(config);
  revalidatePath("/admin/videos");
  revalidatePath("/");
}

export async function addVideo(video: Omit<AdminVideo, "id">) {
  await requireAuth();
  const config = await getAdminConfig();

  const newVideo: AdminVideo = {
    ...video,
    id: crypto.randomUUID(),
  };

  if (!config.videos) {
    // Initialize from default static list — caller should pass the defaults
    config.videos = [newVideo];
  } else {
    config.videos.push(newVideo);
  }

  await saveAdminConfig(config);
  revalidatePath("/admin/videos");
  revalidatePath("/");
}

export async function removeVideo(id: string) {
  await requireAuth();
  const config = await getAdminConfig();

  if (config.videos) {
    config.videos = config.videos.filter((v) => v.id !== id);
    await saveAdminConfig(config);
  }

  revalidatePath("/admin/videos");
  revalidatePath("/");
}

export async function toggleVideoVisibility(id: string) {
  await requireAuth();
  const config = await getAdminConfig();

  if (config.videos) {
    config.videos = config.videos.map((v) =>
      v.id === id ? { ...v, visible: !v.visible } : v
    );
    await saveAdminConfig(config);
  }

  revalidatePath("/admin/videos");
  revalidatePath("/");
}
