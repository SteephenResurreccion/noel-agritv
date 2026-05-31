/**
 * Central customer-facing copy for the Noel AgriTV storefront.
 *
 * Phase 1 (current): a behavior-identical English refactor. Every value here is
 * the VERBATIM current rendered text â€” capitalization, punctuation, the ellipsis
 * character (â€¦), and ampersands are all load-bearing for the pixel-identical gate.
 * Phase 2 (later): this module is translated to natural Taglish.
 *
 * Rules:
 *   - Storefront copy only. Admin (`src/app/(admin)`, `admin-*` components) stays
 *     English and MUST NOT consume this module.
 *   - Plain TS, no side effects â€” safe to import from both server and client
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
    loading: "Loadingâ€¦",
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
    noResults: (query: string) => `No products found for â€œ${query}â€`,
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
    copyright: "Â© 2026 Noel AgriTV. All rights reserved.",
    tagline: "Natural farming solutions for the Philippines",
  },
  announcementBar: {
    items: [
      "Bio-organic products trusted by 250k+ Filipino farmers",
      "Message us on Facebook to order â€” nationwide delivery via J&T",
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
    heroSocial: "Since 2021 Â· 250k+ Followers",
    topPicks: "Top Picks For You",
    viewAll: "View all Products â†’",
    missionEyebrow: "Our Mission",
    missionQuote:
      "â€œI started Noel AgriTV to help Filipino farmers grow more with less â€” using natural, affordable solutions that actually work in our soil and climate.â€",
    missionAttribution: "Noel Tolentino â€” Founder",
    ourStory: "Our Story â†’",
    missionImageAlt: "Noel Tolentino holding fresh harvested vegetables",
  },
  socialProof: {
    strip: "250k+ Followers Â· Since 2021 Â· Nationwide via J&T",
  },
  awards: {
    eyebrow: "Awards & Recognition",
    title: "Recognized for Excellence in Filipino Agriculture",
    prevAriaLabel: "Previous award",
    nextAriaLabel: "Next award",
    nav: (i: number) => `Go to award ${i}`,
    items: [
      "Certificates of Recognition & Appreciation",
      "Noel AgriTV â€” The Art of Helping Others",
      "STELA Magazine â€” Sustainable Farming & Humanitarian Advocate",
      "2024 Excellent Filipino Awards â€” Outstanding Leadership in Agri Business",
      "2024 Philippines Choice Award â€” Humanitarian Service in Agri Business",
      "STELA 2024 â€” Most Outstanding Agri Business Leader of the Year",
    ],
  },
  videoReel: {
    title: "See It From the Farm â€” Come Take a Peek!",
    scrollLeftAriaLabel: "Scroll left",
    scrollRightAriaLabel: "Scroll right",
    seeAllOnFacebook: "See all videos on Facebook â†’",
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
} as const;