import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SocialProofStrip } from "@/components/social-proof-strip";
import { ProductCard } from "@/components/product-card";
import { HomeProductFilter } from "@/components/home-product-filter";
import { VideoReelSection } from "@/components/video-reel-section";
import { products } from "@/data/products";
import { categories } from "@/data/categories";

export const metadata: Metadata = {
  title: "Noel AgriTV — Natural Solutions for Better Harvests",
  description:
    "Bio-organic crop care products and quality seeds trusted by Filipino farmers since 2021. Browse our products and message us to order.",
};

export default function HomePage() {
  return (
    <>
      {/* ── Section 1: Hero Banner — TBOF style ── */}
      <section className="relative overflow-hidden bg-bg pb-[120px] min-[741px]:pb-[160px]">
        {/* Warm accent — sun/circle top-right like TBOF */}
        <div className="absolute right-6 top-6 z-10 hidden min-[741px]:block" aria-hidden="true">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" fill="#C97B3A" fillOpacity="0.85" />
            <path d="M18 22 Q22 16 28 20 Q32 14 36 22" stroke="#fff" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
          </svg>
        </div>

        {/* Main content — z-[3] keeps everything above the landscape */}
        <div className="container-site relative z-[3] mx-auto px-[var(--spacing-container-gutter)] pt-8 min-[741px]:pt-10">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-16">
            {/* Left — Hero image, rounded, extends into landscape */}
            <div className="relative z-[1] min-[741px]:mb-[-80px]">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/images/founder-with-plants.jpg"
                  alt="Noel Tolentino holding fresh harvested vegetables"
                  width={720}
                  height={960}
                  priority
                  className="h-full w-full object-cover max-[740px]:aspect-[3/4] max-[740px]:max-h-[420px] min-[741px]:max-h-[480px]"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right — Text content, vertically centered */}
            <div className="pb-8 text-center min-[741px]:pb-12 min-[741px]:text-left">
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
            {/* Back hills — lightest, warm tan */}
            <path
              d="M0 80 C160 30,320 60,520 40 C720 20,900 55,1100 35 C1250 20,1380 50,1440 40 L1440 200 L0 200Z"
              fill="#B8A040"
              fillOpacity="0.25"
            />
            {/* Middle hills — olive gold */}
            <path
              d="M0 110 C100 70,280 90,460 78 C640 65,780 85,960 72 C1120 62,1300 80,1440 72 L1440 200 L0 200Z"
              fill="#9E8A30"
              fillOpacity="0.45"
            />
            {/* Front hills — darkest, earthy brown */}
            <path
              d="M0 140 C180 110,350 125,550 115 C750 105,900 122,1100 112 C1260 104,1380 118,1440 112 L1440 200 L0 200Z"
              fill="#7A6B20"
              fillOpacity="0.6"
            />
            {/* Ground base */}
            <rect x="0" y="175" width="1440" height="25" fill="#8B7A28" fillOpacity="0.5" />
          </svg>

          {/* Farmer and tree — separate SVG so they don't stretch */}
          <svg
            viewBox="0 0 1440 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 block h-full w-full"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Farmer silhouette — left-center, within the landscape band */}
            <g transform="translate(480,90)" fill="#3A3015" fillOpacity="1">
              <circle cx="16" cy="0" r="7" />
              <ellipse cx="16" cy="-3" rx="10" ry="2.5" />
              <path d="M11 7 L9 38 L14 38 L16 24 L18 38 L23 38 L21 7Z" />
              <path d="M11 11 L3 24 L6 26 L13 16Z" />
              <rect x="0" y="22" width="7" height="8" rx="1" />
              <path d="M0 24 L-4 20" stroke="#3A3015" strokeWidth="1.5" fill="none" />
              <path d="M21 11 L27 22 L24 24 L19 16Z" />
              <path d="M12 36 L10 52 L14 52 L15 42 L16 42 L17 52 L21 52 L19 36Z" />
            </g>

            {/* Tree — right side */}
            <g transform="translate(1280,40)" fill="#3A3015" fillOpacity="0.9">
              <rect x="20" y="50" width="8" height="45" rx="2" />
              <path d="M28 62 Q42 50 46 42" stroke="#3A3015" strokeOpacity="0.8" strokeWidth="2.5" fill="none" />
              <ellipse cx="24" cy="35" rx="26" ry="19" />
              <ellipse cx="15" cy="28" rx="16" ry="14" />
              <ellipse cx="38" cy="32" rx="18" ry="16" />
              <ellipse cx="50" cy="42" rx="8" ry="6" />
            </g>

            {/* Birds */}
            <g transform="translate(1320,30)" fill="#5A4A20" fillOpacity="0.6">
              <path d="M0 5 Q3 0 6 3 Q9 0 12 5 Q9 3 6 6 Q3 3 0 5Z" />
            </g>
            <g transform="translate(1260,20)" fill="#5A4A20" fillOpacity="0.5">
              <path d="M0 4 Q2.5 0 5 2.5 Q7.5 0 10 4 Q7.5 2.8 5 5.2 Q2.5 2.8 0 4Z" />
            </g>
          </svg>
        </div>
      </section>

      {/* ── Section 2: Our Products (TBOF-style: filter pills + product cards) */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <div>
            <h2
              className="font-bold text-brand-darkest"
              style={{ fontSize: "var(--font-size-h2)" }}
            >
              Our Products
            </h2>
            <div className="mt-2 h-1 w-12 bg-brand-accent" />
          </div>

          {/* Category filter pills */}
          <HomeProductFilter categories={categories} products={products} />

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

      {/* ── Section 3: Mission — Brightland-style (text left, image right) ── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
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
                  src="/images/mission.jpg"
                  alt="Noel Tolentino standing in a rice paddy"
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

      {/* ── Section 4: Video Reels (TBOF-style carousel) ──────────────── */}
      <VideoReelSection />

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
