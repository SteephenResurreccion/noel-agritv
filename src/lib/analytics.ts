"use client";

import { track } from "@vercel/analytics";

export function trackMessengerClick(context?: string) {
  track("messenger_click", { context: context ?? "unknown" });
}

export function trackCallClick(context?: string) {
  track("call_click", { context: context ?? "unknown" });
}

export function trackProductView(slug: string) {
  track("product_view", { slug });
}

export function trackVideoPlay(videoId: string) {
  track("video_play", { videoId });
}

export function trackCategoryFilter(category: string) {
  track("category_filter", { category });
}
