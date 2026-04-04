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
      <section className="relative overflow-hidden border-b border-brand-darkest/10 bg-bg">
        <div className="container-site relative mx-auto px-[var(--spacing-container-gutter)] py-10 min-[741px]:py-20">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-16">
            {/* Left — Hero image, tall like TBOF */}
            <div className="relative min-[741px]:self-stretch">
              <div className="overflow-hidden rounded-2xl shadow-xl min-[741px]:h-full">
                <Image
                  src="/images/possible_hero.jpg"
                  alt="Noel AgriTV — Filipino farming community"
                  width={2000}
                  height={1125}
                  priority
                  className="h-full w-full object-cover max-[740px]:aspect-[16/9] min-[741px]:min-h-[480px]"
                  sizes="(max-width: 740px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Right — Text content, larger typography like TBOF */}
            <div className="text-center min-[741px]:text-left">
              <p className="text-2xl italic text-brand-dark min-[741px]:text-[28px]">
                Bio-organic products
              </p>
              <p className="text-2xl italic text-brand-dark min-[741px]:text-[28px]">
                trusted by Filipino farmers
              </p>
              <h1 className="mt-4 text-[40px] font-bold leading-[1.05] text-brand-darkest min-[741px]:text-[56px]">
                Natural Solutions
              </h1>
              <h1 className="text-[40px] font-bold leading-[1.05] text-brand-accent min-[741px]:text-[56px]">
                For Better Harvests
              </h1>
              <p className="mt-4 text-xl font-semibold text-brand-dark">
                Since 2021 · 250k+ Followers
              </p>

              <div className="mt-8 flex flex-col items-center gap-3 min-[741px]:flex-row min-[741px]:items-start">
                <Link
                  href="/products"
                  className="inline-flex h-14 items-center justify-center rounded-[var(--radius-button)] bg-brand-darkest px-10 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark"
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
