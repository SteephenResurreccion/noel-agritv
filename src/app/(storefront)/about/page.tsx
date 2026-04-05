import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { FACEBOOK_URL, YOUTUBE_URL, MESSENGER_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Noel | Noel AgriTV",
  description:
    "Learn about Noel Tolentino and Noel AgriTV — helping Filipino farmers grow more with natural, bio-organic solutions since 2021.",
};

const stats = [
  { value: "250k+", label: "Facebook Followers" },
  { value: "2021", label: "Founded" },
];

export default function AboutPage() {
  return (
    <>
      {/* ── Hero — founder portrait + mission text side by side ──────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto">
          <div className="grid items-center gap-8 min-[741px]:grid-cols-[1fr_1fr] min-[741px]:gap-16">
            {/* Portrait */}
            <div className="overflow-hidden rounded-2xl">
              <Image
                src="/images/founder-with-plants.jpg"
                alt="Noel Tolentino with plants on his farm"
                width={640}
                height={800}
                priority
                className="h-full w-full object-cover max-[740px]:aspect-[4/5] max-[740px]:max-h-[480px]"
                sizes="(max-width: 740px) 100vw, 50vw"
              />
            </div>

            {/* Text */}
            <div>
              <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
                Our Mission
              </p>
              <h1
                className="mt-4 font-bold text-text-primary"
                style={{ fontSize: "var(--font-size-h1)" }}
              >
                Helping Filipino farmers grow more with natural solutions
              </h1>
              <p className="mt-4 leading-relaxed text-text-secondary">
                Since 2021, Noel AgriTV has been sharing practical, affordable
                bio-organic farming techniques that work in Philippine soil and
                climate — and selling only the products we trust.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Origin Story ───────────────────────────────────────────────── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl">
          <h2
            className="font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            The Story
          </h2>
          <div className="mt-2 h-1 w-12 bg-brand-accent" />
          <div className="mt-6 space-y-4 leading-relaxed text-text-secondary">
            <p>
              Noel Tolentino started Noel AgriTV in 2021 with a simple goal:
              share practical, affordable bio-organic farming techniques that
              actually work in Philippine soil and climate. What began as a
              Facebook page grew into a community of over 250,000 farmers,
              gardeners, and agriculture enthusiasts across the country.
            </p>
            <p>
              Every product we carry has been tested on Noel&apos;s own farm. We
              only sell what we believe in — natural solutions that improve
              yields, reduce chemical dependence, and fit within the budget of
              the everyday Filipino farmer.
            </p>
            <p>
              From seed to harvest, we&apos;re here to help you grow.
            </p>
          </div>
        </div>
      </section>

      {/* ── By the Numbers ─────────────────────────────────────────────── */}
      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl">
          <h2
            className="text-center font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            By the Numbers
          </h2>
          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="border border-border bg-surface p-6 text-center"
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

      {/* ── What We Believe ────────────────────────────────────────────── */}
      <section className="bg-surface px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
        <div className="container-site mx-auto max-w-2xl">
          <h2
            className="font-bold text-text-primary"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            What We Believe
          </h2>
          <div className="mt-2 h-1 w-12 bg-brand-accent" />
          <ul className="mt-6 space-y-4">
            {[
              {
                title: "Test everything ourselves",
                desc: "Every product is field-tested on Noel\u2019s farm before it reaches yours.",
              },
              {
                title: "Natural first",
                desc: "Bio-organic solutions that improve yields without harsh chemicals.",
              },
              {
                title: "Affordable for every farmer",
                desc: "Quality products priced for the everyday Filipino grower, not just large operations.",
              },
              {
                title: "Teach, don\u2019t just sell",
                desc: "Free farming tips and tutorials on Facebook and YouTube — because knowledge grows harvests.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-accent" />
                <div>
                  <p className="font-semibold text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Featured Video ─────────────────────────────────────────────────
           COMMENTED OUT — waiting for client to provide YouTube video ID.
           To enable: import YouTubeFacade, replace REPLACE_WITH_VIDEO_ID.

      <section className="bg-bg px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
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
            Join the Community
          </p>
          <h2
            className="mt-4 font-bold text-white"
            style={{ fontSize: "var(--font-size-h2)" }}
          >
            Follow Noel&apos;s journey
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            Daily farming tips, product demonstrations, and behind-the-scenes
            content from the farm.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[#1877F2] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1565d8]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
              Facebook
            </Link>
            <Link
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-[#FF0000] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#cc0000]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              YouTube
            </Link>
            <Link
              href={MESSENGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-button)] bg-brand-accent px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Message Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
