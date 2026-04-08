"use client";

const PAGE_USERNAME = "noeltolentino2728";
const MESSENGER_WEB = `https://www.messenger.com/t/${PAGE_USERNAME}`;
const M_ME_URL = `https://m.me/${PAGE_USERNAME}`;

/** Open Messenger to the client's conversation.
 *  - Mobile: messenger.com/t/ triggers iOS/Android App Links → opens Messenger app directly
 *  - Desktop: opens messenger.com in a new tab */
export function openMessenger() {
  if (typeof navigator === "undefined") return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!isMobile) {
    window.open(MESSENGER_WEB, "_blank", "noopener,noreferrer");
    return;
  }

  // messenger.com/t/ is registered as an App Link — iOS and Android
  // will intercept it and open the Messenger app to the correct thread.
  // Unlike m.me which redirects through facebook.com first.
  window.location.href = MESSENGER_WEB;
}
