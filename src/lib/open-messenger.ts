"use client";

const PAGE_USERNAME = "noeltolentino2728";
const M_ME_URL = `https://m.me/${PAGE_USERNAME}`;

/** Try fb-messenger:// deep link first, fall back to m.me after a timeout.
 *  On desktop, just open m.me in a new tab. */
export function openMessenger() {
  if (typeof navigator === "undefined") return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    window.open(M_ME_URL, "_blank", "noopener,noreferrer");
    return;
  }

  // On mobile, try the native scheme first
  const deepLink = `fb-messenger://user-thread/${PAGE_USERNAME}`;
  const start = Date.now();

  window.location.href = deepLink;

  // If we're still here after 1.5s, the app didn't open — fall back to m.me
  setTimeout(() => {
    if (document.hidden) return; // app opened, page went to background
    if (Date.now() - start < 2000) {
      window.location.href = M_ME_URL;
    }
  }, 1500);
}
