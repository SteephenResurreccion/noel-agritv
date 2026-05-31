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
  header: {
    searchProductsAriaLabel: "Search products",
    searchProductsPlaceholder: "Search products...",
    openMenuAriaLabel: "Open menu",
    logoAlt: "Noel AgriTV",
    mainNavAriaLabel: "Main navigation",
    navAbout: "About",
    navContact: "Contact",
    searchAriaLabel: "Search",
    close: "Close",
    productsHeading: "Products",
    noResults: (query: string) => `No products found for “${query}”`,
    trendingSearches: "Trending Searches",
    trendingTerms: [
      "Bio Plant Booster",
      "Bio Enzyme",
      "Rice Seeds",
      "Jasmine",
      "Mayumi",
    ],
    shopByCategory: "Shop By Category",
    topProducts: "Top Products",
    mobileNavAriaLabel: "Mobile navigation",
    navHome: "Home",
    closeMenuAriaLabel: "Close menu",
  },
  footer: {
    logoAlt: "Noel AgriTV",
    since: "Since 2021",
    blurb:
      "Natural, bio-organic crop care products trusted by Filipino farmers nationwide.",
    facebookAriaLabel: "Facebook",
    youtubeAriaLabel: "YouTube",
    messengerAriaLabel: "Messenger",
    shop: "Shop",
    shopLinksAriaLabel: "Footer shop links",
    allProducts: "All Products",
    cropCare: "Crop Care",
    seeds: "Seeds",
    company: "Company",
    companyLinksAriaLabel: "Footer company links",
    aboutNoelAgriTv: "About Noel AgriTV",
    contactUs: "Contact Us",
    getInTouch: "Get in Touch",
    messageUsOnFacebook: "Message us on Facebook",
    jtExpress: "J&T Express",
    nationwideDelivery: "Nationwide Delivery",
    gcash: "GCash",
    maya: "Maya",
    cod: "COD",
    copyright: "© 2026 Noel AgriTV. All rights reserved.",
    tagline: "Natural farming solutions for the Philippines",
  },
  announcementBar: {
    items: [
      "Bio-organic products trusted by 250k+ Filipino farmers",
      "Message us on Facebook to order — nationwide delivery via J&T",
      "Natural crop care solutions since 2021",
    ],
  },
  mobileBottomBar: {
    quickActionsAriaLabel: "Quick actions",
    products: "Products",
    messenger: "Messenger",
    sms: "SMS",
    call: "Call",
  },
} as const;
