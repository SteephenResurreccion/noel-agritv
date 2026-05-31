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
  checkout: {
    title: "Checkout",
    contact: "Contact",
    name: "Name",
    mobile: "Mobile number",
    phonePlaceholder: "09XXXXXXXXX",
    deliveryAddress: "Delivery address",
    orderNotes: "Order notes",
    notesLabel: "Notes for the team (optional)",
    payment: "Payment",
    cod: "Cash on Delivery (COD)",
    privacy: "Privacy",
    privacyNotice:
      "By placing this order you agree that Noel AgriTV will use your name, phone number, and address solely to process and deliver your order, per the Data Privacy Act of 2012 (RA 10173).",
    orderSummary: "Order summary",
    lineItem: (unit: string, qty: number) => `${unit} × ${qty}`,
    subtotal: "Subtotal",
    shipping: "Shipping",
    free: "FREE",
    estimatedTotal: "Estimated total",
    estimatedShipping: "Estimated shipping",
    shippingOnCall: "Shipping confirmed on the call.",
    placing: "Placing order…",
    place: "Place order",
    messageToComplete: "Message us to complete your order",
  },
  confirmation: {
    received: "Order received",
    teamWillContact:
      "Our team will text/call you to confirm your order before shipping.",
    save: "Save your order number",
    copyAriaLabel: "Copy order number",
    copied: "Copied ✓",
    copy: "Copy",
    checkStatus: "Check status any time",
  },
  lookup: {
    // title reuses copy.common.findMyOrder ("Find my order") — same byte-for-byte
    help: "Enter your order number and the last 4 digits of the phone number you used at checkout to see your order status.",
    loadingForm: "Loading lookup form…",
    orderNumber: "Order number",
    orderNumberPlaceholder: "NAG-YYYYMMDD-XXXX",
    last4: "Last 4 digits of your phone",
    last4Placeholder: "1234",
    looking: "Looking up…",
    // submit (resolved) reuses copy.common.findMyOrder ("Find my order")
    messageUsOnMessenger: "Message us on Messenger",
    items: "Items",
    subtotal: "Subtotal",
    shipping: "Shipping",
    trackJt: "Track shipment on J&T →",
    confirmedNotice:
      "Your order is confirmed. We'll text you the tracking number once it's booked with J&T.",
    messageUs: "Message us",
  },
  track: {
    title: "Track My Order",
    help: "Enter the tracking number we texted you to follow your order on J&T's official tracker.",
    waybill: "J&T tracking number",
    hint: "Enter your tracking number to continue.",
    trackOnJt: "Track on J&T",
    noTrackingYet: "Don't have a tracking number yet?",
    lookup: "Look up your order",
  },
  about: {
    missionEyebrow: "Our Mission",
    heroHeading: "Helping Filipino farmers grow more with natural solutions",
    heroBody:
      "Since 2021, Noel AgriTV has been sharing practical, affordable bio-organic farming techniques that work in Philippine soil and climate — and selling only the products we trust.",
    storyHeading: "The Story",
    storyP1:
      "Noel Tolentino started Noel AgriTV in 2021 with a simple goal: share practical, affordable bio-organic farming techniques that actually work in Philippine soil and climate. What began as a Facebook page grew into a community of over 250,000 farmers, gardeners, and agriculture enthusiasts across the country.",
    storyP2:
      "Every product we carry has been tested on Noel's own farm. We only sell what we believe in — natural solutions that improve yields, reduce chemical dependence, and fit within the budget of the everyday Filipino farmer.",
    storyP3: "From seed to harvest, we're here to help you grow.",
    byTheNumbersHeading: "By the Numbers",
    statFollowers: "Facebook Followers",
    statFounded: "Founded",
    portraitAlt: "Noel Tolentino with plants on his farm",
    believeHeading: "What We Believe",
    believeItems: [
      {
        title: "Test everything ourselves",
        desc: "Every product is field-tested on Noel’s farm before it reaches yours.",
      },
      {
        title: "Natural first",
        desc: "Bio-organic solutions that improve yields without harsh chemicals.",
      },
      {
        title: "Affordable for every farmer",
        desc: "Quality products priced for the everyday Filipino grower, not just large operations.",
      },
      {
        title: "Teach, don’t just sell",
        desc: "Free farming tips and tutorials on Facebook and YouTube — because knowledge grows harvests.",
      },
    ],
    joinEyebrow: "Join the Community",
    followHeading: "Follow Noel's journey",
    followBody:
      "Daily farming tips, product demonstrations, and behind-the-scenes content from the farm.",
    facebook: "Facebook",
    youtube: "YouTube",
    // "Message Us" CTA reuses copy.common.messenger
  },
  contact: {
    heading: "Get In Touch",
    subheading: "We'd love to hear from you",
    messengerTitle: "Facebook Messenger",
    messengerHours:
      "We typically reply within a few hours (Mon–Sat, 8am–6pm PHT)",
    messengerCta: "Message Us on Facebook →",
    phoneTitle: "Phone",
    phoneHelp: (phone: string) => `${phone} — Tap to call`,
    facebookPageTitle: "Facebook Page",
    facebookPageHandle: "facebook.com/noeltolentino2728",
    emailTitle: "Email",
    wholesaleTitle: "Wholesale Inquiries",
    wholesaleHelp:
      "Buying in bulk? We offer volume discounts on all products with nationwide J&T delivery. Message us or call for wholesale pricing.",
    wholesaleCta: "Inquire on Messenger →",
    faqHeading: "Frequently Asked Questions",
  },
  faq: [
    {
      q: "Is this the same Noel AgriTV from Facebook?",
      a: "Yes, this is the official website of Noel AgriTV. You can verify by checking our Facebook page — the link is the same one Noel shares in his videos.",
    },
    {
      q: "Do you deliver nationwide?",
      a: "Yes, we deliver nationwide through J&T Express. Delivery times vary by province — typically 3-7 business days depending on your location.",
    },
    {
      q: "How do I order?",
      a: "Message us on Facebook or call — we'll confirm your order and arrange delivery via J&T.",
    },
    {
      q: "How long does delivery take?",
      a: "Delivery times vary by province. Metro Manila typically receives orders within 2-3 business days. Provincial deliveries usually take 3-7 business days through J&T Express.",
    },
  ],
  notFound: {
    code: "404",
    message: "Page not found — this link may have been moved or removed.",
    home: "Go Home",
    // browse CTA reuses copy.common.browseProducts ("Browse Products")
  },
} as const;