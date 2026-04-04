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
      <section className="relative overflow-hidden bg-bg">
        <div className="min-[741px]:min-h-[85vh]">
          <div className="grid min-[741px]:grid-cols-2 min-[741px]:min-h-[85vh]">
            {/* Left — Hero image, full-bleed on left edge */}
            <div className="relative">
              <Image
                src="/images/founder-with-plants.jpg"
                alt="Noel Tolentino holding fresh harvested vegetables"
                width={720}
                height={960}
                priority
                className="h-full w-full object-cover max-[740px]:aspect-[3/4] max-[740px]:max-h-[520px] min-[741px]:absolute min-[741px]:inset-0"
                sizes="(max-width: 740px) 100vw, 50vw"
              />
            </div>

            {/* Right — Text content, vertically centered */}
            <div className="flex items-center px-[var(--spacing-container-gutter)] py-12 max-[740px]:text-center min-[741px]:py-20 min-[741px]:pl-12 min-[741px]:pr-[var(--spacing-container-gutter)]">
              <div>
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
