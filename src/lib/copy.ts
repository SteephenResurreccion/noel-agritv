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
  home: {
    heroImageAlt: "Noel Tolentino standing in a rice paddy",
    heroTaglineLine1: "Bio-organic products",
    heroTaglineLine2: "trusted by Filipino farmers",
    heroHeadlineLine1: "Natural Solutions",
    heroHeadlineLine2: "For Better Harvests",
    heroSocial: "Since 2021 · 250k+ Followers",
    topPicks: "Top Picks For You",
    viewAll: "View all Products →",
    missionEyebrow: "Our Mission",
    missionQuote:
      "“I started Noel AgriTV to help Filipino farmers grow more with less — using natural, affordable solutions that actually work in our soil and climate.”",
    missionAttribution: "Noel Tolentino — Founder",
    ourStory: "Our Story →",
    missionImageAlt: "Noel Tolentino holding fresh harvested vegetables",
  },
  socialProof: {
    strip: "250k+ Followers · Since 2021 · Nationwide via J&T",
  },
  awards: {
    eyebrow: "Awards & Recognition",
    title: "Recognized for Excellence in Filipino Agriculture",
    prevAriaLabel: "Previous award",
    nextAriaLabel: "Next award",
    nav: (i: number) => `Go to award ${i}`,
    items: [
      "Certificates of Recognition & Appreciation",
      "Noel AgriTV — The Art of Helping Others",
      "STELA Magazine — Sustainable Farming & Humanitarian Advocate",
      "2024 Excellent Filipino Awards — Outstanding Leadership in Agri Business",
      "2024 Philippines Choice Award — Humanitarian Service in Agri Business",
      "STELA 2024 — Most Outstanding Agri Business Leader of the Year",
    ],
  },
  videoReel: {
    title: "See It From the Farm — Come Take a Peek!",
    scrollLeftAriaLabel: "Scroll left",
    scrollRightAriaLabel: "Scroll right",
    seeAllOnFacebook: "See all videos on Facebook →",
  },
  productList: {
    title: "All Products",
    empty: "No products found in this category.",
  },
  productDetail: {
    askOnMessenger: "Ask on Messenger",
    whatItDoes: "What It Does",
    howToApply: "How to Apply",
    compatibleCrops: "Compatible Crops",
    safety: "Safety & Handling",
    watch: "Watch",
    demoVideoSuffix: (name: string) => `${name} — Demo Video`,
    related: "You May Also Like",
  },
  productCard: {
    wholesaleAvailable: "Wholesale available",
  },
  addToCart: {
    add: "Add to cart",
    added: "Added ✓",
    eachAtQty: (qty: number) => `each · at ${qty} pcs`,
    quantity: "Quantity",
    decreaseQuantityAriaLabel: "Decrease quantity",
    increaseQuantityAriaLabel: "Increase quantity",
    addWithTotal: (total: string) => `Add to cart · ${total}`,
    wholesaleHint: "Wholesale price — buy more, save more",
    tipid: "Tipid sa dami.",
    discountAuto: "Discount applies automatically — no code needed.",
  },
  tierTable: {
    qty: "Quantity",
    priceEach: "Price each",
  },
  cart: {
    empty: "Your cart is empty",
    // ⚠ Verbatim cart text is "Browse products" (lowercase p). copy.common.browseProducts
    // is "Browse Products" (capital P) — different rendered casing, so this is a SEPARATE key.
    browse: "Browse products",
    title: "Your cart",
    itemCount: (n: number) => `${n} items`,
    eachPrice: (price: string) => `${price} each`,
    removeAria: (name: string) => `Remove ${name}`,
    nudge: (units: number) => `Add ${units} more`,
    nudgeEach: (price: string) => `${price} each`,
    freeUnlocked: "FREE shipping unlocked",
    freeShippingPrompt: (remaining: number) =>
      `Add ${remaining} more item${remaining === 1 ? "" : "s"} for FREE shipping`,
    subtotal: "Subtotal",
    checkoutWithSubtotal: (subtotal: string) => `Checkout · ${subtotal}`,
  },
  checkoutBar: {
    summaryAria: "Cart summary",
    count: (n: number) => (n === 1 ? "1 item" : `${n} items`),
    checkout: "Checkout →",
  },
  cartBadge: {
    label: "Cart",
    aria: (n: number) => `Cart, ${n} items`,
    overflow: "99+",
  },
} as const;