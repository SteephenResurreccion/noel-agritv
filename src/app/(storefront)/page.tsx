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

        {/* Decorative farm landscape — rolling hills, farmer, tree (TBOF-style) */}
        <div className="absolute inset-x-0 bottom-0 z-0" aria-hidden="true">
          <svg
            viewBox="0 0 1440 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            preserveAspectRatio="none"
          >
            {/* Back hills — lightest */}
            <path
              d="M0 120 C200 70,400 90,600 75 C800 60,1000 85,1200 70 C1350 60,1420 80,1440 75 L1440 160 L0 160Z"
              fill="#4D734C"
              fillOpacity="0.15"
            />
            {/* Middle hills */}
            <path
              d="M0 130 C150 95,350 110,500 100 C700 88,850 105,1050 92 C1200 82,1350 100,1440 95 L1440 160 L0 160Z"
              fill="#3B593F"
              fillOpacity="0.25"
            />
            {/* Front hills — darkest */}
            <path
              d="M0 140 C120 115,300 128,480 118 C660 108,800 125,1000 115 C1150 107,1300 120,1440 112 L1440 160 L0 160Z"
              fill="#2A4038"
              fillOpacity="0.35"
            />
            {/* Ground strip */}
            <rect x="0" y="148" width="1440" height="12" fill="#2A4038" fillOpacity="0.4" />

            {/* Farmer silhouette — walking with bucket, center-right */}
            <g transform="translate(780,96)" fill="#172621" fillOpacity="0.5">
              {/* Head */}
              <circle cx="8" cy="3" r="3.5" />
              {/* Hat brim */}
              <ellipse cx="8" cy="1.5" rx="5.5" ry="1.2" />
              {/* Body */}
              <path d="M6 6.5 L5 18 L7 18 L8 12 L9 18 L11 18 L10 6.5Z" />
              {/* Left arm with bucket */}
              <path d="M6 8 L2 14 L3.5 14.5 L6.5 10Z" />
              {/* Bucket */}
              <rect x="1" y="13" width="4" height="3.5" rx="0.5" />
              {/* Right arm */}
              <path d="M10 8 L13 12 L11.5 13 L9.5 10Z" />
            </g>

            {/* Tree — right side */}
            <g transform="translate(1300,68)" fill="#2A4038" fillOpacity="0.4">
              {/* Trunk */}
              <rect x="12" y="30" width="4" height="22" rx="1" />
              {/* Canopy layers */}
              <ellipse cx="14" cy="22" rx="14" ry="10" />
              <ellipse cx="10" cy="18" rx="8" ry="7" />
              <ellipse cx="20" cy="20" rx="9" ry="8" />
              {/* Small branch right */}
              <path d="M16 38 Q22 34 24 30" stroke="#2A4038" strokeOpacity="0.4" strokeWidth="1.5" fill="none" />
              <circle cx="25" cy="29" r="3" />
            </g>

            {/* Small bird — top right */}
            <g transform="translate(1350,62)" fill="#4D734C" fillOpacity="0.3">
              <path d="M0 3 Q2 0 4 2 Q6 0 8 3 Q6 2 4 4 Q2 2 0 3Z" />
            </g>

            {/* Distant bird */}
            <g transform="translate(1200,55)" fill="#4D734C" fillOpacity="0.2">
              <path d="M0 2 Q1.5 0 3 1.5 Q4.5 0 6 2 Q4.5 1.5 3 3 Q1.5 1.5 0 2Z" />
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
