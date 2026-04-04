import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SocialProofStrip } from "@/components/social-proof-strip";
import { categories } from "@/data/categories";

export const metadata: Metadata = {
  title: "Noel AgriTV — Natural Solutions for Better Harvests",
  description:
    "Bio-organic crop care products and quality seeds trusted by Filipino farmers since 2021. Browse our products and message us to order.",
};

export default function HomePage() {
  return (
    <>
      {/* ── Section 1: Hero + Social Proof ─────────────────────────────── */}
      <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl text-center">
          <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
            Noel AgriTV
          </p>
          <h1
            className="mt-4 font-bold text-white"
            style={{ fontSize: "var(--font-size-h1)" }}
          >
            Natural solutions for better harvests
          </h1>
          <p className="mt-4 text-white/70">
            Bio-organic products trusted by Filipino farmers since 2021
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-accent px-5 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-brand-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              Browse Products
            </Link>
          </div>
          <div className="mt-6">
            <SocialProofStrip />
          </div>
        </div>
      </section>

      {/* ── Section 2: Category Tiles ───────────────────────────────────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <h2
            className="text-center font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            Our Products
          </h2>
          <div
            className="mt-[var(--spacing-grid-gap)] grid grid-cols-2 gap-[var(--spacing-grid-gap)]"
          >
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/products?category=${category.slug}`}
                className="group overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-shadow hover:shadow-md"
              >
                <div className="relative h-[120px] w-full md:h-[200px]">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-text-primary">
                    {category.name}
                  </p>
                  <p className="mt-0.5 text-[length:var(--font-size-meta)] text-text-secondary">
                    {category.subtitle}
                  </p>
                </div>
              </Link>
            ))}
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

      {/* ── Section 4: Featured Video ───────────────────────────────────
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
