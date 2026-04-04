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
      <section className="relative overflow-hidden bg-bg pb-0">
        {/* Main content */}
        <div className="container-site relative z-10 mx-auto px-[var(--spacing-container-gutter)] pb-28 pt-10 min-[741px]:pb-36 min-[741px]:pt-16">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-12">
            {/* Left — Hero image */}
            <div className="relative">
              <div className="overflow-hidden">
                <Image
                  src="/images/founder-with-plants.jpg"
                  alt="Noel Tolentino holding fresh harvested vegetables"
                  width={720}
                  height={960}
                  priority
                  className="h-full w-full object-cover max-[740px]:aspect-[3/4] max-[740px]:max-h-[500px] min-[741px]:min-h-[560px]"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right — Text content */}
            <div className="text-center min-[741px]:text-left">
              <p className="text-[22px] italic leading-snug text-brand-dark min-[741px]:text-[30px]">
                Bio-organic products
              </p>
              <p className="text-[22px] italic leading-snug text-brand-dark min-[741px]:text-[30px]">
                trusted by Filipino farmers
              </p>
              <h1 className="mt-5 text-[46px] font-bold leading-[1] text-brand-darkest min-[741px]:text-[64px]">
                Natural Solutions
              </h1>
              <h1 className="text-[46px] font-bold leading-[1] text-brand-accent min-[741px]:text-[64px]">
                For Better Harvests
              </h1>
              <p className="mt-5 text-[18px] font-semibold text-brand-dark min-[741px]:text-xl">
                Since 2021 · 250k+ Followers
              </p>

              <div className="mt-10 flex flex-col items-center gap-3 min-[741px]:flex-row min-[741px]:items-start">
                <Link
                  href="/products"
                  className="inline-flex h-14 items-center justify-center rounded-[var(--radius-button)] bg-brand-darkest px-12 text-[13px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-brand-dark"
                >
                  Browse Products
                </Link>
              </div>

              <div className="mt-8">
                <SocialProofStrip variant="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative farm landscape — TBOF-style rolling hills, farmer, tree */}
        <div className="absolute inset-x-0 bottom-0 z-0" aria-hidden="true">
          <svg
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full h-[140px] min-[741px]:h-[200px]"
            preserveAspectRatio="none"
          >
            {/* Back hills — lightest, olive-green */}
            <path
              d="M0 180 C160 100,320 140,520 110 C720 80,900 130,1100 100 C1250 80,1380 120,1440 105 L1440 320 L0 320Z"
              fill="#6B7F3B"
              fillOpacity="0.3"
            />
            {/* Middle hills — warm earthy green */}
            <path
              d="M0 210 C100 160,280 185,460 165 C640 145,780 175,960 155 C1120 140,1300 170,1440 155 L1440 320 L0 320Z"
              fill="#5C6B30"
              fillOpacity="0.4"
            />
            {/* Front hills — darkest, solid */}
            <path
              d="M0 250 C180 210,350 235,550 218 C750 200,900 228,1100 212 C1260 200,1380 222,1440 215 L1440 320 L0 320Z"
              fill="#3B4A20"
              fillOpacity="0.55"
            />
            {/* Ground base */}
            <rect x="0" y="285" width="1440" height="35" fill="#3B4A20" fillOpacity="0.6" />
          </svg>

          {/* Farmer and tree as a separate non-stretched SVG */}
          <svg
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute inset-0 block h-full w-full"
            preserveAspectRatio="xMidYMax meet"
          >
            {/* Farmer silhouette — walking with watering can */}
            <g transform="translate(720,170)" fill="#2A3A1C" fillOpacity="0.7">
              {/* Head */}
              <circle cx="16" cy="0" r="9" />
              {/* Hat */}
              <ellipse cx="16" cy="-4" rx="13" ry="3" />
              {/* Body / torso */}
              <path d="M10 9 L8 50 L14 50 L16 30 L18 50 L24 50 L22 9Z" />
              {/* Left arm holding can */}
              <path d="M10 14 L0 32 L4 34 L12 20Z" />
              {/* Watering can */}
              <rect x="-3" y="30" width="9" height="10" rx="1.5" fill="#2A3A1C" fillOpacity="0.6" />
              <path d="M-3 32 L-8 28" stroke="#2A3A1C" strokeOpacity="0.5" strokeWidth="2" />
              {/* Right arm */}
              <path d="M22 14 L30 28 L26 30 L20 20Z" />
              {/* Legs with gap */}
              <path d="M12 48 L10 70 L14 70 L15 55 L16 55 L17 70 L21 70 L19 48Z" />
            </g>

            {/* Tree — right side, larger */}
            <g transform="translate(1240,80)" fill="#2A3A1C" fillOpacity="0.55">
              {/* Trunk */}
              <rect x="28" y="70" width="10" height="60" rx="2" />
              {/* Branch right */}
              <path d="M38 90 Q55 75 60 65" stroke="#2A3A1C" strokeOpacity="0.45" strokeWidth="3" fill="none" />
              {/* Main canopy */}
              <ellipse cx="33" cy="50" rx="32" ry="24" />
              <ellipse cx="22" cy="42" rx="20" ry="18" />
              <ellipse cx="48" cy="46" rx="22" ry="20" />
              {/* Small canopy on branch */}
              <ellipse cx="62" cy="60" rx="10" ry="8" />
            </g>

            {/* Birds */}
            <g transform="translate(1300,70)" fill="#3B593F" fillOpacity="0.4">
              <path d="M0 6 Q4 0 8 4 Q12 0 16 6 Q12 4 8 8 Q4 4 0 6Z" />
            </g>
            <g transform="translate(1230,55)" fill="#3B593F" fillOpacity="0.3">
              <path d="M0 5 Q3 0 6 3 Q9 0 12 5 Q9 3.5 6 6.5 Q3 3.5 0 5Z" />
            </g>

            {/* Small plant / shrub — left side */}
            <g transform="translate(80,240)" fill="#4D734C" fillOpacity="0.35">
              <ellipse cx="12" cy="8" rx="12" ry="10" />
              <ellipse cx="24" cy="12" rx="8" ry="7" />
              <rect x="10" y="16" width="4" height="10" rx="1" />
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
