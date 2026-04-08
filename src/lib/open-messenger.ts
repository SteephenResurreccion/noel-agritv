"use client";

const PAGE_USERNAME = "noeltolentino2728";
const MESSENGER_WEB = `https://www.messenger.com/t/${PAGE_USERNAME}`;

/** Open Messenger to the client's conversation.
 *  - Mobile: messenger.com/t/ triggers iOS/Android App Links → opens Messenger app directly
 *  - Desktop: opens messenger.com with ?text= prefilled message in a new tab
 */
export function openMessenger(productName?: string) {
  if (typeof navigator === "undefined") return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    // Desktop: ?text= works on web Messenger
    const text = productName
      ? `Hi, I'm interested in ${productName}`
      : undefined;
    const url = text
      ? `${MESSENGER_WEB}?text=${encodeURIComponent(text)}`
      : MESSENGER_WEB;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  // Mobile: messenger.com/t/ opens the app directly via App Links
  // ?text= is ignored by the mobile app, so no point appending it
  window.location.href = MESSENGER_WEB;
}
