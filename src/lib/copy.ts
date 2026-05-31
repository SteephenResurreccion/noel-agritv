/**
 * Central customer-facing copy for the Noel AgriTV storefront.
 *
 * Phase 1 (current): a behavior-identical English refactor. Every value here is
 * the VERBATIM current rendered text — capitalization, punctuation, the ellipsis
 * character (…), and ampersands are all load-bearing for the pixel-identical gate.
 * Phase 2 (later): this module is translated to natural Taglish.
 *
 * Rules:
 *   - Storefront copy only. Admin (`src/app/(admin)`, `admin-*` components) stays
 *     English and MUST NOT consume this module.
 *   - Plain TS, no side effects — safe to import from both server and client
 *     components. Do NOT add "use client" or any server-only import here.
 *   - `brand` is kept untranslated everywhere.
 */
export const copy = {
  common: {
    messenger: "Message Us",
    messengerAboutProduct: "Message Us About This Product",
    callToOrder: "Call to Order",
    browseProducts: "Browse Products",
    continueShopping: "Continue shopping",
    findMyOrder: "Find my order",
    productsNav: "Products",
    loading: "Loading…",
    filterAll: "All",
    antiSpam: "Anti-spam check failed. Please retry.",
    brand: "Noel AgriTV", // kept untranslated everywhere
  },
} as const;
