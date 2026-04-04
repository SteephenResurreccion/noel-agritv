"use client";

/**
 * Detect if the current browser is Facebook's in-app browser (IAB).
 * Checks for FBAN or FBAV in the user agent string.
 * Must be called client-side only.
 */
export function isFacebookIAB(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV/.test(ua);
}
