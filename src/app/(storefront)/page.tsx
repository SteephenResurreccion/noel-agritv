import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SocialProofStrip } from "@/components/social-proof-strip";
import { ProductCard } from "@/components/product-card";
import { HomeProductFilter } from "@/components/home-product-filter";
import { VideoReelSection } from "@/components/video-reel-section";
import { WholesaleBanner } from "@/components/wholesale-banner";
import { AwardsSection } from "@/components/awards-section";
import { AnnouncementBar } from "@/components/announcement-bar";
import { products, type Product } from "@/data/products";
import { categories } from "@/data/categories";
import { getAdminConfig } from "@/lib/admin-store";
import { adminToProduct } from "@/lib/admin-to-product";
import { defaultVideos } from "@/data/videos";

export const revalidate = 30; // ISR: revalidate every 30s instead of force-dynamic

export const metadata: Metadata = {
  title: "Noel AgriTV — Natural Solutions for Better Harvests",
  description:
    "Bio-organic crop care products and quality seeds trusted by Filipino farmers since 2021. Browse our products and message us to order.",
};

export default async function HomePage() {
  let visibleProducts: Product[] = products;
  let featuredProducts: Product[] = [];
  let videoItems = defaultVideos.filter((v) => v.visible);

  try {
    const config = await getAdminConfig();
    const custom: Product[] = (config.customProducts ?? [])
      .filter((p) => p.visible)
      .map(adminToProduct);

    if (custom.length > 0) {
      visibleProducts = custom;
    } else {
      visibleProducts = products.filter(
        (p) => !config.hiddenProducts.includes(p.slug)
      );
    }

    // Featured products for "Top Picks" — ordered by admin
    const featuredIds = config.featuredProductIds ?? [];
    if (featuredIds.length > 0) {
      featuredProducts = featuredIds
        .map((id) => {
          const cp = (config.customProducts ?? []).find((p) => p.id === id && p.visible);
          return cp ? adminToProduct(cp) : undefined;
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
                  alt="Noel Tolentino standing in a rice paddy"
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
                Bio-organic products
              </p>
              <p className="text-[22px] italic leading-snug text-brand-dark min-[741px]:text-[28px]">
                trusted by Filipino farmers
              </p>
              <h1 className="mt-3 text-[50px] font-bold leading-[0.95] text-brand-darkest min-[741px]:text-[76px]">
                Natural Solutions
              </h1>
              <h1 className="text-[50px] font-bold leading-[0.95] text-brand-accent min-[741px]:text-[76px]">
                For Better Harvests
              </h1>
              <p className="mt-5 text-[18px] font-semibold text-brand-dark min-[741px]:text-xl">
                Since 2021 · 250k+ Followers
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 min-[741px]:flex-row min-[741px]:items-start">
                <Link
                  href="/products"
                  className="inline-flex h-14 items-center justify-center rounded-[var(--radius-button)] bg-brand-darkest px-12 text-[15px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-dark"
                >
                  Browse Products
                </Link>
              </div>

              <div className="mt-6">
                <SocialProofStrip variant="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative farm landscape — thin band at very bottom like TBOF */}
        <div className="absolute inset-x-0 bottom-0 z-[2]" aria-hidden="true">
          <svg
            viewBox="0 0 1440 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block h-[120px] w-full min-[741px]:h-[160px]"
            preserveAspectRatio="none"
          >
            {/* Back hills — lightest brand green */}
            <path
              d="M0 80 C160 30,320 60,520 40 C720 20,900 55,1100 35 C1250 20,1380 50,1440 40 L1440 200 L0 200Z"
              fill="#4D734C"
            />
            {/* Middle hills — mid brand green */}
            <path
              d="M0 110 C100 70,280 90,460 78 C640 65,780 85,960 72 C1120 62,1300 80,1440 72 L1440 200 L0 200Z"
              fill="#3B593F"
            />
            {/* Front hills — dark brand green */}
            <path
              d="M0 140 C180 110,350 125,550 115 C750 105,900 122,1100 112 C1260 104,1380 118,1440 112 L1440 200 L0 200Z"
              fill="#2A4038"
            />
            {/* Ground base */}
            <rect x="0" y="175" width="1440" height="25" fill="#172621" />
          </svg>

          {/* Farmer and tree — separate SVG so they don't stretch */}
          <svg
            viewBox="0 0 1440 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 block h-full w-full"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Tree cluster — far left, two trees clumped together */}
            <g transform="translate(40,45)" fill="#000000">
              {/* Smaller tree behind */}
              <rect x="18" y="70" width="10" height="55" rx="2" />
              <ellipse cx="23" cy="45" rx="32" ry="28" />
              <ellipse cx="12" cy="38" rx="22" ry="20" />
              <ellipse cx="38" cy="42" rx="24" ry="22" />
              {/* Larger tree in front, overlapping */}
              <rect x="65" y="60" width="14" height="70" rx="3" />
              <ellipse cx="72" cy="32" rx="48" ry="38" />
              <ellipse cx="55" cy="24" rx="34" ry="28" />
              <ellipse cx="92" cy="30" rx="36" ry="30" />
              <ellipse cx="108" cy="45" rx="16" ry="12" />
            </g>

            {/* Tree 3 — center-right, wide spreading, lower position */}
            <g transform="translate(820,55)" fill="#000000">
              <rect x="38" y="62" width="12" height="58" rx="2" />
              <ellipse cx="44" cy="38" rx="46" ry="34" />
              <ellipse cx="28" cy="28" rx="30" ry="24" />
              <ellipse cx="64" cy="32" rx="32" ry="26" />
            </g>

            {/* Tree cluster — right side, two trees close together */}
            <g transform="translate(1100,20)" fill="#000000">
              {/* Big tree */}
              <rect x="48" y="82" width="16" height="78" rx="3" />
              <path d="M64 96 Q90 76 98 62" stroke="#000000" strokeWidth="4" fill="none" />
              <ellipse cx="56" cy="46" rx="58" ry="44" />
              <ellipse cx="38" cy="34" rx="40" ry="34" />
              <ellipse cx="80" cy="40" rx="42" ry="36" />
              <ellipse cx="104" cy="56" rx="20" ry="16" />
              {/* Smaller companion tree, slightly behind and to the right */}
              <rect x="120" y="75" width="10" height="55" rx="2" />
              <ellipse cx="125" cy="50" rx="34" ry="28" />
              <ellipse cx="112" cy="42" rx="24" ry="22" />
              <ellipse cx="140" cy="46" rx="26" ry="24" />
            </g>

            {/* Birds */}
            <g transform="translate(1300,18)" fill="#000000" fillOpacity="0.7">
              <path d="M0 6 Q4 0 8 4 Q12 0 16 6 Q12 3.5 8 7.5 Q4 3.5 0 6Z" />
            </g>
            <g transform="translate(600,28)" fill="#000000" fillOpacity="0.6">
              <path d="M0 5 Q3.5 0 7 3 Q10.5 0 14 5 Q10.5 3 7 6.5 Q3.5 3 0 5Z" />
            </g>
          </svg>
        </div>
      </section>

      {/* ── Section 2: Our Products (TBOF-style: filter pills + product cards) */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <h2 className="font-heading text-[38px] font-bold text-brand-darkest min-[741px]:text-[54px]">
            Top Picks For You
          </h2>

          {/* Category filter pills */}
          <HomeProductFilter categories={categories} products={topPicks} />

          {/* "View all" link */}
          <div className="mt-4 text-right">
            <Link
              href="/products"
              className="text-sm font-semibold text-brand-accent hover:underline"
            >
              View all Products →
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
                Our Mission
              </p>
              <blockquote className="mt-6">
                <p className="text-[28px] font-bold leading-[1.25] text-text-primary min-[741px]:text-[36px]">
                  &ldquo;I started Noel AgriTV to help Filipino farmers grow
                  more with less — using natural, affordable solutions that
                  actually work in our soil and climate.&rdquo;
                </p>
              </blockquote>
              <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-text-secondary">
                Noel Tolentino — Founder
              </p>
              <Link
                href="/about"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-brand-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Our Story →
              </Link>
            </div>

            {/* Right — Portrait photo */}
            <div className="relative min-[741px]:self-stretch">
              <div className="overflow-hidden rounded-2xl min-[741px]:h-full">
                <Image
                  src="/images/New-Found-Hero.png"
                  alt="Noel Tolentino holding fresh harvested vegetables"
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

      {/* ── Divider strip ─────────────────────────────────────────────── */}
      <AnnouncementBar
        announcements={[
          { text: "Healthy soil, healthy harvest — go bio-organic", href: "/products" },
          { text: "Proven effective in Philippine climate and soil conditions", href: "/about" },
          { text: "Quality seeds for every growing season", href: "/products" },
        ]}
        direction="right"
      />

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
