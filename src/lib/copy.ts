/**
 * Central customer-facing copy for the Noel AgriTV storefront.
 *
 * Phase 1: a behavior-identical English refactor extracted every customer-facing
 * string into this single module.
 * Phase 2 (current): values are translated to natural Taglish. KEYS and function
 * SIGNATURES are frozen. Every storefront consumer references these keys, so the
 * shape MUST stay identical for TypeScript to compile.
 *
 * Rules:
 *   - Storefront copy only. Admin (`src/app/(admin)`, `admin-*` components) stays
 *     English and MUST NOT consume this module.
 *   - Plain TS, no side effects (safe to import from both server and client
 *     components). Do NOT add "use client" or any server-only import here.
 *   - `brand` is kept untranslated everywhere.
 *   - Brand/commerce/unit terms stay English: Cart, GCash, Maya, GrabPay, QR Ph,
 *     COD, J&T, Noel AgriTV, ml, L, kg, pcs, Subtotal.
 */
export const copy = {
  common: {
    messenger: "Mag-message sa amin",
    messengerAboutProduct: "I-message kami tungkol sa produktong ito",
    callToOrder: "Tumawag para mag-order",
    browseProducts: "Tingnan ang mga Produkto",
    continueShopping: "Magpatuloy sa pamimili",
    findMyOrder: "Hanapin ang order ko",
    productsNav: "Mga Produkto",
    loading: "Naglo-load…",
    filterAll: "Lahat",
    antiSpam: "Hindi pumasa ang anti-spam check. Pakisubukan ulit.",
    brand: "Noel AgriTV", // kept untranslated everywhere
  },
  header: {
    searchProductsAriaLabel: "Maghanap ng produkto",
    searchProductsPlaceholder: "Maghanap ng produkto...",
    openMenuAriaLabel: "Buksan ang menu",
    logoAlt: "Noel AgriTV",
    mainNavAriaLabel: "Pangunahing navigation",
    navAbout: "Tungkol Sa Amin",
    navContact: "Kontak",
    searchAriaLabel: "Maghanap",
    close: "Isara",
    productsHeading: "Mga Produkto",
    noResults: (query: string) => `Walang nahanap na produkto para sa “${query}”`,
    trendingSearches: "Mga Sikat na Hinahanap",
    trendingTerms: [
      "Bio Plant Booster",
      "Bio Enzyme",
      "Rice Seeds",
      "Jasmine",
      "Mayumi",
    ],
    shopByCategory: "Mamili Ayon sa Kategorya",
    topProducts: "Mga Top na Produkto",
    mobileNavAriaLabel: "Mobile navigation",
    navHome: "Home",
    closeMenuAriaLabel: "Isara ang menu",
  },
  footer: {
    logoAlt: "Noel AgriTV",
    since: "Mula 2021",
    blurb:
      "Natural at bio-organic na crop care products na pinagkakatiwalaan ng mga Pilipinong magsasaka sa buong bansa.",
    facebookAriaLabel: "Facebook",
    youtubeAriaLabel: "YouTube",
    messengerAriaLabel: "Messenger",
    shop: "Mamili",
    shopLinksAriaLabel: "Mga shop link sa footer",
    allProducts: "Lahat ng Produkto",
    cropCare: "Pangalaga sa Pananim",
    seeds: "Mga Binhi",
    company: "Kompanya",
    companyLinksAriaLabel: "Mga company link sa footer",
    aboutNoelAgriTv: "Tungkol sa Noel AgriTV",
    contactUs: "Kontakin Kami",
    getInTouch: "Makipag-ugnayan",
    messageUsOnFacebook: "I-message kami sa Facebook",
    jtExpress: "J&T Express",
    nationwideDelivery: "Delivery sa Buong Bansa",
    gcash: "GCash",
    maya: "Maya",
    cod: "COD",
    copyright: "© 2026 Noel AgriTV. Lahat ng karapatan ay nakalaan.",
    tagline: "Natural na solusyon sa pagsasaka para sa Pilipinas",
  },
  announcementBar: {
    items: [
      "Bio-organic na produkto, pinagkakatiwalaan ng 250k+ na Pilipinong magsasaka",
      "I-message kami sa Facebook para mag-order. Delivery sa buong bansa via J&T",
      "Natural na crop care solutions mula pa 2021",
    ],
  },
  mobileBottomBar: {
    quickActionsAriaLabel: "Mga mabilisang aksyon",
    products: "Produkto",
    messenger: "Messenger",
    sms: "SMS",
    call: "Tawag",
  },
  home: {
    heroImageAlt: "Si Noel Tolentino na nakatayo sa palayan",
    heroTaglineLine1: "Bio-organic na produkto",
    heroTaglineLine2: "pinagkakatiwalaan ng mga Pilipinong magsasaka",
    heroHeadlineLine1: "Natural na Solusyon",
    heroHeadlineLine2: "Para sa Mas Masaganang Ani",
    heroSocial: "Mula 2021 · 250k+ na Followers",
    topPicks: "Top Picks Para Sa'yo",
    viewAll: "Tingnan lahat ng Produkto →",
    missionEyebrow: "Ang Misyon Namin",
    missionQuote:
      "“Sinimulan ko ang Noel AgriTV para tulungan ang mga Pilipinong magsasaka na umani nang mas marami sa mas kaunti, gamit ang natural at abot-kayang solusyon na talagang umuubra sa ating lupa at klima.”",
    missionAttribution: "Noel Tolentino, Founder",
    ourStory: "Ang Kuwento Namin →",
    missionImageAlt: "Si Noel Tolentino na may hawak na sariwang aning gulay",
  },
  socialProof: {
    strip: "250k+ na Followers · Mula 2021 · Buong bansa via J&T",
  },
  awards: {
    eyebrow: "Mga Parangal at Pagkilala",
    title: "Kinilala sa Kahusayan sa Agrikultura ng Pilipinas",
    prevAriaLabel: "Nakaraang parangal",
    nextAriaLabel: "Susunod na parangal",
    nav: (i: number) => `Pumunta sa parangal ${i}`,
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
    title: "Silipin Mula sa Bukid, Halika at Tingnan!",
    scrollLeftAriaLabel: "Mag-scroll pakaliwa",
    scrollRightAriaLabel: "Mag-scroll pakanan",
    seeAllOnFacebook: "Panoorin lahat ng video sa Facebook →",
  },

  // ─── Home: Video facade (lazy-load YouTube embed) ───────────────
  // ${title} is video DATA passed in by the component (fixed UI text only here).
  videoFacade: {
    thumbnail: (title: string) => `Thumbnail para sa ${title}`,
    play: (title: string) => `Panoorin ang ${title}`,
  },
  productList: {
    title: "Lahat ng Produkto",
    empty: "Walang nahanap na produkto sa kategoryang ito.",
  },
  productDetail: {
    askOnMessenger: "Magtanong sa Messenger",
    whatItDoes: "Ano ang Ginagawa Nito",
    howToApply: "Paano Gamitin",
    compatibleCrops: "Mga Tugmang Pananim",
    safety: "Kaligtasan at Paggamit",
    watch: "Panoorin",
    demoVideoSuffix: (name: string) => `${name}: Demo Video`,
    related: "Baka Magustuhan Mo Rin",
  },
  productCard: {
    wholesaleAvailable: "May wholesale",
  },
  addToCart: {
    add: "Idagdag sa Cart",
    added: "Naidagdag ✓",
    eachAtQty: (qty: number) => `bawat isa · sa ${qty} pcs`,
    quantity: "Dami",
    decreaseQuantityAriaLabel: "Bawasan ang dami",
    increaseQuantityAriaLabel: "Dagdagan ang dami",
    addWithTotal: (total: string) => `Idagdag sa Cart · ${total}`,
    wholesaleHint: "Wholesale price: bumili nang marami, mas mura",
    tipid: "Tipid sa dami.",
    discountAuto: "Awtomatik na nababawas ang diskwento. Walang code na kailangan.",
  },
  tierTable: {
    qty: "Dami",
    priceEach: "Presyo bawat isa",
  },
  cart: {
    empty: "Walang laman ang Cart mo",
    // ⚠ Verbatim cart text is "Browse products" (lowercase p). copy.common.browseProducts
    // is "Browse Products" (capital P), different rendered casing, so this is a SEPARATE key.
    browse: "Tingnan ang mga produkto",
    title: "Ang Cart mo",
    itemCount: (n: number) => `${n} item`,
    eachPrice: (price: string) => `${price} bawat isa`,
    removeAria: (name: string) => `Tanggalin ang ${name}`,
    nudge: (units: number) => `Magdagdag pa ng ${units}`,
    nudgeEach: (price: string) => `${price} bawat isa`,
    freeUnlocked: "Naka-unlock na ang Libreng padala",
    freeShippingPrompt: (remaining: number) =>
      `Magdagdag pa ng ${remaining} item para sa Libreng padala`,
    subtotal: "Subtotal",
    checkoutWithSubtotal: (subtotal: string) => `Mag-checkout · ${subtotal}`,
  },
  checkoutBar: {
    summaryAria: "Buod ng Cart",
    count: (n: number) => `${n} item`,
    checkout: "Mag-checkout →",
  },
  cartBadge: {
    label: "Cart",
    aria: (n: number) => `Cart, ${n} item`,
    overflow: "99+",
  },
  checkout: {
    title: "Mag-checkout",
    contact: "Kontak",
    name: "Pangalan",
    mobile: "Mobile number",
    phonePlaceholder: "09XXXXXXXXX",
    deliveryAddress: "Address ng delivery",
    orderNotes: "Mga tala sa order",
    notesLabel: "Tala para sa team (opsyonal)",
    payment: "Bayad",
    cod: "COD: Bayad pagdating",
    privacy: "Privacy",
    privacyNotice:
      "Sa pag-order, sumasang-ayon kang gagamitin ng Noel AgriTV ang iyong pangalan, numero ng telepono, at address para lamang iproseso at ihatid ang iyong order, ayon sa Data Privacy Act of 2012 (RA 10173).",
    orderSummary: "Buod ng Order",
    lineItem: (unit: string, qty: number) => `${unit} × ${qty}`,
    subtotal: "Subtotal",
    shipping: "Bayad sa padala",
    free: "LIBRE",
    estimatedTotal: "Tinatayang kabuuan",
    estimatedShipping: "Tinatayang bayad sa padala",
    shippingOnCall: "Kumpirmado ang padala sa tawag.",
    placing: "Ino-order na…",
    place: "I-order na",
    messageToComplete: "I-message kami para makumpleto ang order mo",
  },
  confirmation: {
    received: "Salamat po sa order mo!",
    teamWillContact:
      "Te-text o tatawagan ka ng team namin para kumpirmahin ang order mo bago ipadala.",
    save: "I-save ang order number mo",
    copyAriaLabel: "Kopyahin ang order number",
    copied: "Nakopya ✓",
    copy: "Kopyahin",
    checkStatus: "I-check ang status kahit kailan",
  },
  lookup: {
    // title reuses copy.common.findMyOrder ("Hanapin ang order ko"), same byte-for-byte
    help: "Ilagay ang order number mo at ang huling 4 na digit ng numerong ginamit mo sa checkout para makita ang status ng order mo.",
    loadingForm: "Nilo-load ang lookup form…",
    orderNumber: "Order number",
    orderNumberPlaceholder: "NAG-YYYYMMDD-XXXX",
    last4: "Huling 4 na digit ng numero mo",
    last4Placeholder: "1234",
    looking: "Hinahanap…",
    // submit (resolved) reuses copy.common.findMyOrder ("Hanapin ang order ko")
    messageUsOnMessenger: "I-message kami sa Messenger",
    items: "Mga Item",
    subtotal: "Subtotal",
    shipping: "Bayad sa padala",
    trackJt: "I-track ang padala sa J&T →",
    confirmedNotice:
      "Kumpirmado na ang order mo. Te-text namin sa'yo ang tracking number kapag na-book na sa J&T.",
    messageUs: "I-message kami",
  },
  track: {
    title: "I-track ang Order Mo",
    help: "Ilagay ang tracking number na ni-text namin sa'yo para masubaybayan ang order mo sa opisyal na tracker ng J&T.",
    waybill: "J&T tracking number",
    trackOnJt: "I-track sa J&T",
    noTrackingYet: "Wala ka pang tracking number?",
    lookup: "Hanapin ang order mo",
  },
  about: {
    missionEyebrow: "Ang Misyon Namin",
    heroHeading: "Tinutulungan ang mga Pilipinong magsasaka na umani nang mas marami gamit ang natural na solusyon",
    heroBody:
      "Mula 2021, ibinabahagi ng Noel AgriTV ang praktikal at abot-kayang bio-organic na pamamaraan sa pagsasaka na umuubra sa lupa at klima ng Pilipinas, at ipinagbibili lang ang mga produktong pinagkakatiwalaan namin.",
    storyHeading: "Ang Kuwento",
    storyP1:
      "Sinimulan ni Noel Tolentino ang Noel AgriTV noong 2021 na may simpleng layunin: ibahagi ang praktikal at abot-kayang bio-organic na pamamaraan sa pagsasaka na talagang umuubra sa lupa at klima ng Pilipinas. Ang nagsimula bilang isang Facebook page ay lumago na komunidad ng mahigit 250,000 na magsasaka, hardinero, at mga mahilig sa agrikultura sa buong bansa.",
    storyP2:
      "Bawat produktong dala namin ay nasubok na sa sariling bukid ni Noel. Ipinagbibili lang namin ang pinaniniwalaan namin: natural na solusyon na nagpapataas ng ani, nagbabawas ng pag-asa sa kemikal, at kasya sa budget ng ordinaryong Pilipinong magsasaka.",
    storyP3: "Mula binhi hanggang ani, nandito kami para tulungan kang umani.",
    byTheNumbersHeading: "Sa mga Numero",
    statFollowers: "Mga Facebook Follower",
    statFounded: "Itinatag",
    portraitAlt: "Si Noel Tolentino na may mga halaman sa kanyang bukid",
    believeHeading: "Ang Pinaniniwalaan Namin",
    believeItems: [
      {
        title: "Sinusubok namin mismo ang lahat",
        desc: "Bawat produkto ay nasubok sa bukid ni Noel bago marating ang sa'yo.",
      },
      {
        title: "Natural muna",
        desc: "Bio-organic na solusyon na nagpapataas ng ani nang walang malalakas na kemikal.",
      },
      {
        title: "Abot-kaya para sa bawat magsasaka",
        desc: "Dekalidad na produkto na may presyong kaya ng ordinaryong Pilipinong magsasaka, hindi lang ng malalaking operasyon.",
      },
      {
        title: "Magturo, hindi lang magbenta",
        desc: "Libreng farming tips at tutorial sa Facebook at YouTube, dahil ang kaalaman ay nagpapayabong ng ani.",
      },
    ],
    joinEyebrow: "Sumali sa Komunidad",
    followHeading: "Sundan ang paglalakbay ni Noel",
    followBody:
      "Araw-araw na farming tips, mga demo ng produkto, at behind-the-scenes na nilalaman mula sa bukid.",
    facebook: "Facebook",
    youtube: "YouTube",
    // "Mag-message sa amin" CTA reuses copy.common.messenger
  },
  contact: {
    heading: "Makipag-ugnayan",
    subheading: "Gusto naming marinig ang sa'yo",
    messengerTitle: "Facebook Messenger",
    messengerHours:
      "Karaniwang sumasagot kami sa loob ng ilang oras (Lun–Sab, 8am–6pm PHT)",
    messengerCta: "I-message Kami sa Facebook →",
    phoneTitle: "Telepono",
    phoneHelp: (phone: string) => `${phone}. I-tap para tumawag`,
    facebookPageTitle: "Facebook Page",
    facebookPageHandle: "facebook.com/noeltolentino2728",
    emailTitle: "Email",
    wholesaleTitle: "Mga Tanong sa Wholesale",
    wholesaleHelp:
      "Bumibili nang marami? May volume discount kami sa lahat ng produkto na may delivery sa buong bansa via J&T. I-message o tawagan kami para sa wholesale pricing.",
    wholesaleCta: "Magtanong sa Messenger →",
    faqHeading: "Mga Madalas Itanong",
  },
  faq: [
    {
      q: "Ito ba ang parehong Noel AgriTV na nasa Facebook?",
      a: "Oo, ito ang opisyal na website ng Noel AgriTV. Pwede mong i-verify sa pamamagitan ng pag-check sa aming Facebook page. Pareho lang ito ng link na ibinabahagi ni Noel sa kanyang mga video.",
    },
    {
      q: "Naghahatid ba kayo sa buong bansa?",
      a: "Oo, naghahatid kami sa buong bansa sa pamamagitan ng J&T Express. Nag-iiba ang oras ng delivery depende sa probinsya, karaniwang 3-7 araw ng negosyo depende sa lokasyon mo.",
    },
    {
      q: "Paano ako mag-order?",
      a: "I-message kami sa Facebook o tumawag. Kukumpirmahin namin ang order mo at aayusin ang delivery via J&T.",
    },
    {
      q: "Gaano katagal ang delivery?",
      a: "Nag-iiba ang oras ng delivery depende sa probinsya. Karaniwang natatanggap ng Metro Manila ang order sa loob ng 2-3 araw ng negosyo. Ang mga probinsyal na delivery ay karaniwang umaabot ng 3-7 araw ng negosyo sa J&T Express.",
    },
  ],
  notFound: {
    code: "404",
    message: "Hindi nahanap ang page. Baka nailipat o natanggal na ang link na ito.",
    home: "Bumalik sa Home",
    // browse CTA reuses copy.common.browseProducts ("Tingnan ang mga Produkto")
  },
  addressFields: {
    region: "Rehiyon",
    province: "Probinsya",
    city: "Lungsod / Bayan",
    barangay: "Barangay",
    street: "Kalye / Bilang ng bahay",
    landmark: "Landmark (opsyonal)",
    selectRegion: "Pumili ng rehiyon…",
    selectProvince: "Pumili ng probinsya…",
    pickRegionFirst: "Pumili muna ng rehiyon",
    selectCity: "Pumili ng lungsod / bayan…",
    pickProvinceFirst: "Pumili muna ng probinsya",
    selectBarangay: "Pumili ng barangay…",
    pickCityFirst: "Pumili muna ng lungsod",
    loadingProvinces: "Nilo-load ang mga probinsya…",
    loadError:
      "Hindi ma-load ang listahan ng probinsya. Pakisubukan ulit o pumili ng ibang rehiyon.",
  },
  geolocate: {
    use: "Gamitin ang lokasyon ko",
    locating: "Hinahanap ang lokasyon…",
    geocoding: "Hinahanap ang address mo…",
    matching: "Itinutugma sa mga probinsya…",
    success: "Na-pre-fill ang address. Pakitsek ang bawat field.",
    denied: "Tinanggihan ang pahintulot sa lokasyon. Pumili nang manu-mano sa baba.",
    unavailable: "Hindi namin nahanap ang lokasyon mo. Pumili nang manu-mano sa baba.",
    noMatch:
      "Nahanap ka namin, pero hindi ma-auto-fill. Pumili nang manu-mano sa baba.",
  },
  wholesaleBanner: {
    eyebrow: "Wholesale",
    title: "Bumibili nang Marami? Kami na ang Bahala Sa'yo",
    benefits: [
      "May volume discount",
      "Delivery sa buong bansa via J&T",
      "Lahat ng produkto, available nang marami",
      "I-message kami sa Facebook o tumawag para magtanong",
    ],
    messageCta: "I-message Kami para sa Wholesale →",
    callPhone: (phone: string) => `Tawagan ang ${phone}`,
  },
  meta: {
    // SEO metadata + JSON-LD text. The title template "%s" and the "| Noel AgriTV"
    // brand suffix are load-bearing (keep them). Brand "Noel AgriTV" kept inside.
    rootTitleDefault: "Noel AgriTV: Natural na Solusyon para sa Mas Masaganang Ani",
    rootTitleTemplate: "%s | Noel AgriTV",
    rootDescription:
      "Bio-organic na crop care products at dekalidad na binhi na pinagkakatiwalaan ng mga Pilipinong magsasaka mula 2021. Tingnan ang mga produkto namin at i-message kami para mag-order.",
    // Org/WebSite JSON-LD description (no trailing "Browse…" sentence).
    orgDescription:
      "Bio-organic na crop care products at dekalidad na binhi na pinagkakatiwalaan ng mga Pilipinong magsasaka mula 2021.",
    productsTitle: "Lahat ng Produkto",
    productsDescription:
      "Tingnan ang bio-organic na crop care products at dekalidad na rice seeds ng Noel AgriTV. I-message kami para mag-order.",
    aboutTitle: "Tungkol kay Noel | Noel AgriTV",
    aboutDescription:
      "Alamin ang tungkol kay Noel Tolentino at sa Noel AgriTV. Tinutulungan ang mga Pilipinong magsasaka na umani nang mas marami gamit ang natural at bio-organic na solusyon mula 2021.",
    contactTitle: "Kontak | Noel AgriTV",
    contactDescription:
      "Makipag-ugnayan sa Noel AgriTV. I-message kami sa Facebook Messenger, tumawag, o mag-email. Gusto naming marinig ang sa'yo.",
    breadcrumbHome: "Home",
    breadcrumbProducts: "Mga Produkto",
  },
  errors: {
    // Checkout schema (src/lib/order.ts): Zod validation messages.
    phone: "Maglagay ng wastong PH mobile number",
    nameRequired: "Kailangan ang pangalan",
    regionInvalid: "Pumili ng wastong rehiyon",
    provinceRequired: "Kailangan ang probinsya",
    cityRequired: "Kailangan ang lungsod / bayan",
    barangayRequired: "Kailangan ang barangay",
    streetRequired: "Kailangan ang kalye / bilang ng bahay",
    privacyRequired: "Kailangan mong sumang-ayon sa privacy notice",
    cartEmpty: "Walang laman ang Cart mo",
    cartTooMany: "Sobrang dami ng item sa Cart",
    // ⚠ Variant with NO trailing period, distinct from common.antiSpam
    // ("…Pakisubukan ulit." with a period). Used ONLY by the checkout schema's
    // Turnstile token validator. Do NOT merge the two spellings.
    antiSpam: "Hindi pumasa ang anti-spam check. Pakisubukan ulit",
    // Lookup schema (src/lib/lookup.ts): Zod validation messages.
    orderFormat: "Ang format ng order number ay NAG-YYYYMMDD-XXXX",
    last4: "Ilagay ang huling 4 na digit ng numero mo",
    // Server action results (checkout/actions.ts, lookup/actions.ts).
    formCheck: "Pakitsek ang form at subukan ulit.",
    lookupFormCheck: "Pakitsek ulit ang form at subukan muli.",
    itemUnavailable: "May item sa Cart mo na hindi na available.",
    submitFailed:
      "Hindi namin ma-submit ang order mo ngayon. I-message kami para makumpleto ito.",
    tooManyLookups: "Sobrang dami ng paghahanap. Subukan ulit pagkalipas ng isang minuto.",
    logUnreachable:
      "Hindi namin maabot ang order log ngayon. I-message kami.",
    orderNotFound:
      "Hindi nahanap ang order. I-double-check ang order number at numero mo, o i-message kami.",
    // Track page empty-submit hint, surfaced on the track-page error path.
    trackEnterNumber: "Ilagay ang tracking number mo para magpatuloy.",
    // sheets.ts shipping display string surfaced in the lookup result.
    shippingOnCall: "Confirmed on call",
  },
} as const;
