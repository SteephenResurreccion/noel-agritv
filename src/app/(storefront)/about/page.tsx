import type { Metadata } from "next";
import Link from "next/link";

import { products } from "@/data/products";
import { FACEBOOK_URL, YOUTUBE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Noel | Noel AgriTV",
  description:
    "Learn about Noel Tolentino and Noel AgriTV — helping Filipino farmers grow more with natural, bio-organic solutions since 2021.",
};

const stats = [
  { value: "250k+", label: "Facebook Followers" },
  { value: "2021", label: "Founded" },
  { value: `${products.length}`, label: "Products" },
  { value: "🇵🇭", label: "Nationwide via J&T" },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Hero Image Placeholder ─────────────────────────────────────── */}
      <div className="w-full bg-brand-darkest aspect-[4/3] md:aspect-[16/9]" aria-hidden="true" />

      {/* ── Mission Block ──────────────────────────────────────────────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl text-center">
          <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
            Our Mission
          </p>
          <h1
            className="mt-4 font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h1)" }}
          >
            Helping Filipino farmers grow more with natural solutions
          </h1>
        </div>
      </section>

      {/* ── Origin Story ───────────────────────────────────────────────── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl space-y-4 text-text-secondary">
          <p>
            Noel Tolentino started Noel AgriTV in 2021 with a simple goal: share
            practical, affordable bio-organic farming techniques that actually
            work in Philippine soil and climate. What began as a Facebook page
            grew into a community of over 250,000 farmers, gardeners, and
            agriculture enthusiasts across the country.
          </p>
          <p>
            Every product we carry has been tested on Noel&apos;s own farm. We
            only sell what we believe in — natural solutions that improve yields,
            reduce chemical dependence, and fit within the budget of the everyday
            Filipino farmer. From seed to harvest, we&apos;re here to help you
            grow.
          </p>
        </div>
      </section>

      {/* ── By the Numbers ─────────────────────────────────────────────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <h2
            className="text-center font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            By the Numbers
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center"
              >
                <p className="text-3xl font-bold text-brand-accent">
                  {stat.value}
                </p>
                <p className="mt-1 text-[length:var(--font-size-meta)] text-text-secondary">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Video ─────────────────────────────────────────────────
           COMMENTED OUT — waiting for client to provide YouTube video ID.
           To enable: import YouTubeFacade, replace REPLACE_WITH_VIDEO_ID.

      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl">
          <h2
            className="text-center font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            Watch Noel in Action
          </h2>
          <div className="mt-[var(--spacing-grid-gap)]">
            <YouTubeFacade
              videoId="REPLACE_WITH_VIDEO_ID"
              title="Noel AgriTV — About Noel"
            />
          </div>
        </div>
      </section>
      ── End Featured Video ── */}

      {/* ── Social CTAs ────────────────────────────────────────────────── */}
      <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-xl text-center">
          <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
            Follow Along
          </p>
          <h2
            className="mt-4 font-bold text-white"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            Follow Noel&apos;s journey
          </h2>
          <p className="mt-3 text-white/70">
            Get daily farming tips, product demonstrations, and behind-the-scenes
            content.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {/* Facebook button */}
            <Link
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#1877F2] px-5 text-sm font-semibold text-white hover:bg-[#1565d8]"
            >
              {/* Facebook icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Facebook
            </Link>

            {/* YouTube button */}
            <Link
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#FF0000] px-5 text-sm font-semibold text-white hover:bg-[#cc0000]"
            >
              {/* YouTube icon SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
