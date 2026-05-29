"use client";

const PAGE_USERNAME = "noeltolentino2728";
const MESSENGER_WEB = `https://www.messenger.com/t/${PAGE_USERNAME}`;

/** Open Messenger to the client's conversation.
 *
 *  Navigation is ALWAYS same-tab (`window.location.assign`). The Facebook
 *  in-app browser — our primary traffic source — silently breaks on
 *  `window.open` / `target="_blank"`, so a new tab/window is never used.
 *
 *  URL selection still varies by UA:
 *   - Mobile: bare messenger.com/t/ — App Links open the Messenger app directly,
 *     and the app ignores `?text=`, so no prefill is appended.
 *   - Desktop: messenger.com/t/ with a `?text=` prefilled message (web Messenger
 *     honors it).
 */
export function openMessenger(productName?: string) {
  if (typeof navigator === "undefined") return;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  let url = MESSENGER_WEB;
  if (!isMobile && productName) {
    // Desktop only: ?text= works on web Messenger (ignored by the mobile app).
    url = `${MESSENGER_WEB}?text=${encodeURIComponent(
      `Hi, I'm interested in ${productName}`,
    )}`;
  }

  // Same-tab redirect for every UA — see note above (Facebook IAB safety).
  window.location.assign(url);
}
