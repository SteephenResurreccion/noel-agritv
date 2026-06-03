import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FACEBOOK_URL, YOUTUBE_URL } from "@/lib/constants";

import { SocialProofStrip } from "@/components/social-proof-strip";
import { HomeProductFilter } from "@/components/home-product-filter";
import { LandscapeDivider } from "@/components/landscape-divider";
import { VideoReelSection } from "@/components/video-reel-section";
import { WholesaleBanner } from "@/components/wholesale-banner";
import { AwardsSection } from "@/components/awards-section";
import { getLocalizedProducts, type Product } from "@/data/products";
import { getLocalizedCategories } from "@/data/categories";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
import { defaultVideos } from "@/data/videos";
import { getCopy, type Lang } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export const revalidate = 30; // ISR: revalidate every 30s instead of force-dynamic

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getCopy(await getLangFromRequest());
  return {
    title: meta.rootTitleDefault,
    description: meta.rootDescription,
  };
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noelagritv.com";

/** WebSite JSON-LD for a language. Non-copy fields are constant. */
function websiteJsonLd(lang: Lang) {
  const copy = getCopy(lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: copy.common.brand,
    url: siteUrl,
    description: copy.meta.orgDescription,
    publisher: {
      "@type": "Organization",
      name: copy.common.brand,
      url: siteUrl,
      sameAs: [FACEBOOK_URL, YOUTUBE_URL],
    },
  };
}

export default async function HomePage() {
  const lang = await getLangFromRequest();
  const copy = getCopy(lang);
  const localizedProducts = getLocalizedProducts(lang);
  const localizedCategories = getLocalizedCategories(lang);
  let visibleProducts: Product[] = localizedProducts;
  let featuredProducts: Product[] = [];
  let videoItems = defaultVideos.filter((v) => v.visible);

  try {
    const config = await getAdminConfig();
    const custom: Product[] = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map((p) => adminToProduct(p, lang));

    if (custom.length > 0) {
      visibleProducts = custom;
    } else {
      visibleProducts = localizedProducts.filter(
        (p) => !config.hiddenProducts.includes(p.slug)
      );
    }

    // Featured products for "Top Picks" — ordered by admin
    const featuredIds = config.featuredProductIds ?? [];
    if (featuredIds.length > 0) {
      featuredProducts = featuredIds
        .map((id) => {
          const cp = (config.customProducts ?? []).find((p) => p.id === id && p.visible);
          return cp ? adminToProduct(cp, lang) : undefined;
        })
        .filter(Boolean) as Product[];
    }

    if (config.videos) {
      videoItems = config.videos.filter((v) => v.visible);
    }
  } catch {
    // Blob not configured — use defaults
  }

  // If no featured products set, fall back to first 4 visible
  const topPicks = featuredProducts.length > 0 ? featuredProducts : visibleProducts.slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd(lang)) }}
      />
      {/* ── Section 1: Hero Banner — TBOF style ── */}
      <section className="relative overflow-hidden bg-bg pb-[100px] min-[741px]:pb-[130px]">
{/* Main content — grid layout with image BEHIND landscape, text ABOVE */}
        <div className="container-site relative mx-auto px-[var(--spacing-container-gutter)] pt-8 min-[741px]:pt-10">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-6">
            {/* Left — Hero image, z-[1] so landscape (z-[2]) covers its bottom */}
            <div className="relative z-[1] min-[741px]:mb-[-100px] min-[741px]:max-w-[80%]">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/mission.jpg"
                  alt={copy.home.heroImageAlt}
                  width={720}
                  height={960}
                  priority
                  className="h-full w-full object-cover max-[740px]:aspect-[3/4] max-[740px]:max-h-[420px]"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right — Text content, z-[3] so it stays above landscape */}
            <div className="relative z-[3] pb-8 text-center min-[741px]:pb-12 min-[741px]:text-left">
              <p className="text-[22px] italic leading-snug text-brand-dark min-[741px]:text-[28px]">
                {copy.home.heroTaglineLine1}
              </p>
              <p className="text-[22px] italic leading-snug text-brand-dark min-[741px]:text-[28px]">
                {copy.home.heroTaglineLine2}
              </p>
              <h1 className="mt-3 text-[50px] font-bold leading-[0.95] text-brand-darkest min-[741px]:text-[76px]">
                {copy.home.heroHeadlineLine1}
              </h1>
              <h1 className="text-[50px] font-bold leading-[0.95] text-brand-accent min-[741px]:text-[76px]">
                {copy.home.heroHeadlineLine2}
              </h1>
              <p className="mt-5 text-[18px] font-semibold text-brand-dark min-[741px]:text-xl">
                {copy.home.heroSocial}
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 min-[741px]:flex-row min-[741px]:items-start">
                <Link
                  href="/products"
                  className="inline-flex h-14 items-center justify-center rounded-[var(--radius-button)] bg-brand-darkest px-12 text-[15px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-dark"
                >
                  {copy.common.browseProducts}
                </Link>
              </div>

              <div className="mt-6">
                <SocialProofStrip variant="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative farm landscape — Airy illustration band at very bottom */}
        <LandscapeDivider className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] w-full select-none" />
      </section>

      {/* ── Section 2: Our Products (TBOF-style: filter pills + product cards) */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <h2 className="font-heading text-[38px] font-bold text-brand-darkest min-[741px]:text-[54px]">
            {copy.home.topPicks}
          </h2>

          {/* Category filter pills */}
          <HomeProductFilter categories={localizedCategories} products={topPicks} />

          {/* "View all" link */}
          <div className="mt-4 text-right">
            <Link
              href="/products"
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              {copy.home.viewAll}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Section 3: Awards & Recognition ─────────────────────────── */}
      <AwardsSection variant="compact" />

      {/* ── Section 4: Mission — Brightland-style (text left, image right) ── */}
      <section className="bg-bg-wheat px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-16">
            {/* Left — Text content */}
            <div>
              <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
                {copy.home.missionEyebrow}
              </p>
              <blockquote className="mt-6">
                <p className="text-[28px] font-bold leading-[1.25] text-text-primary min-[741px]:text-[36px]">
                  {copy.home.missionQuote}
                </p>
              </blockquote>
              <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-text-secondary">
                {copy.home.missionAttribution}
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-brand-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                {copy.home.ourStory}
              </Link>
            </div>

            {/* Right — Portrait photo */}
            <div className="relative min-[741px]:self-stretch">
              <div className="overflow-hidden rounded-2xl min-[741px]:h-full">
                <Image
                  src="/images/New-Found-Hero.png"
                  alt={copy.home.missionImageAlt}
                  width={640}
                  height={960}
                  className="h-full w-full object-cover max-[740px]:aspect-[3/4] max-[740px]:max-h-[480px] min-[741px]:min-h-[480px]"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 5: Wholesale CTA ──────────────────────────────────── */}
      <WholesaleBanner />

      {/* ── Section 5: Video Reels (TBOF-style carousel) ──────────────── */}
      <VideoReelSection videos={videoItems} />

      {/* ── Section 5: Featured Video ───────────────────────────────────
           COMMENTED OUT — waiting for client to provide YouTube video ID.
           To enable: import YouTubeFacade, add videoId and title props.

      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl">
          <h2
            className="text-center font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            See It in Action
          </h2>
          <div className="mt-[var(--spacing-grid-gap)]">
            <YouTubeFacade
              videoId="REPLACE_WITH_VIDEO_ID"
              title="Noel AgriTV — Featured Video"
            />
          </div>
        </div>
      </section>
      ── End Section 4 ── */}
    </>
  );
}
