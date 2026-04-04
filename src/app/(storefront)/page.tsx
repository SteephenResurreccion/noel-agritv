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
      {/* ── Section 1: Hero Banner — TBOF style (image left, text right) ── */}
      <section className="relative overflow-hidden bg-bg">
        {/* Decorative farm landscape at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 min-[741px]:h-28">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            className="absolute bottom-0 w-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 80 C200 20 400 100 600 60 C800 20 1000 90 1200 50 C1350 30 1420 60 1440 55 L1440 120 L0 120Z"
              fill="#3B593F"
              opacity="0.25"
            />
            <path
              d="M0 95 C180 50 380 110 580 75 C780 40 980 100 1180 65 C1350 45 1420 75 1440 70 L1440 120 L0 120Z"
              fill="#2A4038"
              opacity="0.35"
            />
            <path
              d="M0 105 C160 70 360 115 560 90 C760 65 960 110 1160 80 C1340 60 1420 90 1440 85 L1440 120 L0 120Z"
              fill="#172621"
              opacity="0.5"
            />
          </svg>
        </div>

        {/* Decorative bird silhouette — top right */}
        <svg
          className="absolute right-8 top-6 h-6 w-10 text-brand-darkest/15 max-[740px]:hidden"
          viewBox="0 0 40 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M20 12 C16 4 8 2 0 6 C8 4 14 6 18 12 C14 6 8 6 2 10 C10 6 16 8 20 12Z" />
          <path d="M20 12 C24 4 32 2 40 6 C32 4 26 6 22 12 C26 6 32 6 38 10 C30 6 24 8 20 12Z" />
        </svg>

        <div className="container-site relative mx-auto px-[var(--spacing-container-gutter)] py-10 min-[741px]:py-14">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-2 min-[741px]:gap-12">
            {/* Left — Hero image with rounded corners */}
            <div className="relative mx-auto w-full max-w-[520px] min-[741px]:mx-0">
              <div className="overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="/images/possible_hero.jpg"
                  alt="Noel AgriTV — Filipino farming community"
                  width={2000}
                  height={1125}
                  priority
                  className="aspect-[16/9] w-full object-cover"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right — Text content */}
            <div className="text-center min-[741px]:text-left">
              <p className="text-xl italic text-brand-dark min-[741px]:text-2xl">
                Bio-organic products
              </p>
              <p className="text-xl italic text-brand-dark min-[741px]:text-2xl">
                trusted by Filipino farmers
              </p>
              <h1 className="mt-3 text-[32px] font-bold leading-[1.1] text-brand-darkest min-[741px]:text-[44px]">
                Natural Solutions
              </h1>
              <h1 className="text-[32px] font-bold leading-[1.1] text-brand-accent min-[741px]:text-[44px]">
                For Better Harvests
              </h1>
              <p className="mt-3 text-lg font-semibold text-brand-dark">
                Since 2021 · 250k+ Followers
              </p>

              <div className="mt-6 flex flex-col items-center gap-3 min-[741px]:flex-row min-[741px]:items-start">
                <Link
                  href="/products"
                  className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-brand-darkest px-8 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
                >
                  Browse Products
                </Link>
              </div>

              <div className="mt-5">
                <SocialProofStrip variant="dark" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Our Products (TBOF-style: filter pills + product cards) */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
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

      {/* ── Section 3: Mission + About Noel ────────────────────────────── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-[480px] text-center">
          {/* Circular photo placeholder — no photo yet */}
          <div className="mx-auto h-[100px] w-[100px] rounded-full bg-brand-darkest" />
          <p className="mt-6 text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
            Our Mission
          </p>
          <h2
            className="mt-4 font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            Helping Filipino farmers grow more with less
          </h2>
          <p className="mt-4 text-text-secondary">
            Noel Tolentino has been farming and teaching natural agriculture
            techniques since 2021. With 250,000 followers on Facebook, he
            shares practical, affordable bio-organic solutions that work in
            Philippine soil and climate.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-1 font-semibold text-brand-accent underline-offset-4 hover:underline"
          >
            Learn Noel&apos;s Story →
          </Link>
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
