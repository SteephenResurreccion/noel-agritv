"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { FACEBOOK_URL } from "@/lib/constants";

interface VideoItem {
  title: string;
  href: string;
  thumbnail: string;
  product?: {
    name: string;
    image: string;
  };
}

const videos: VideoItem[] = [
  {
    title: "Bio Plant Booster sa Dapog Day 5",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster/1465821378472117/",
    thumbnail: "/images/products/bio-plant-booster.webp",
    product: {
      name: "Bio Plant Booster",
      image: "/images/products/bio-plant-booster.webp",
    },
  },
  {
    title: "Effects of Bio Enzyme Decomposer",
    href: "https://www.facebook.com/noeltolentino2728/videos/effects-of-bio-enzyme-decomposer/1468190017709752/",
    thumbnail: "/images/products/bio-enzyme.webp",
    product: {
      name: "Bio Enzyme",
      image: "/images/products/bio-enzyme.webp",
    },
  },
  {
    title: "Tangkay ng Guyabano, Bio Enzyme at Organic Fertilizer",
    href: "https://www.facebook.com/noeltolentino2728/videos/tangkay-ng-guyabanobio-enzyme-at-organic-fertilizer/341631831216480/",
    thumbnail: "/images/products/bio-enzyme.webp",
  },
  {
    title: "Bio Plant Booster at Bio Enzyme",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster-at-bio-enzyme-noelagritv-09272743281/1809173639854778/",
    thumbnail: "/images/products/bio-plant-booster.webp",
    product: {
      name: "Bio Plant Booster",
      image: "/images/products/bio-plant-booster.webp",
    },
  },
  {
    title: "Mayumi Rice — Malapit na Hampasin Part 7",
    href: "https://www.facebook.com/noeltolentino2728/videos/mayumi-malapit-na-hampasin-part-7/1339573194848901/",
    thumbnail: "/images/products/mayumi-rice-seeds.webp",
    product: {
      name: "Mayumi Rice Seeds",
      image: "/images/products/mayumi-rice-seeds.webp",
    },
  },
  {
    title: "Mayumi Rice — Malapit na Hampasin Part 6",
    href: "https://www.facebook.com/noeltolentino2728/videos/mayumi-malapit-na-hampasin-part-6/1802413510416992/",
    thumbnail: "/images/products/mayumi-rice-seeds.webp",
    product: {
      name: "Mayumi Rice Seeds",
      image: "/images/products/mayumi-rice-seeds.webp",
    },
  },
  {
    title: "How to Control Rice Black Bugs",
    href: "https://www.facebook.com/noeltolentino2728/videos/how-to-control-rice-black-bugs/1150412736514923/",
    thumbnail: "/images/products/jasmine-479-rice-seeds.webp",
  },
  {
    title: "Rice Pruning — Tinesting Natin",
    href: "https://www.facebook.com/noeltolentino2728/videos/749528474756504/",
    thumbnail: "/images/products/jasmine-479-rice-seeds.webp",
    product: {
      name: "Jasmine 479 Seeds",
      image: "/images/products/jasmine-479-rice-seeds.webp",
    },
  },
];

export function VideoReelSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 220;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-[#f0ede4] px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
      <div className="container-site mx-auto">
        <h2
          className="text-center font-heading font-bold italic text-brand-darkest"
          style={{ fontSize: "var(--font-size-h2)" }}
        >
          See It From the Farm — Come Take a Peek!
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Watch Noel&apos;s farming videos on Facebook
        </p>

        {/* Carousel wrapper */}
        <div className="relative mt-8">
          {/* Left arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 top-1/3 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-surface shadow-sm transition-colors hover:bg-bg md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-text-primary" />
          </button>

          {/* Right arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 top-1/3 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-surface shadow-sm transition-colors hover:bg-bg md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-text-primary" />
          </button>

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-2"
          >
            {videos.map((video, i) => (
              <a
                key={i}
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-[180px] shrink-0 overflow-hidden rounded-xl bg-surface shadow-md transition-shadow hover:shadow-lg"
              >
                {/* Video thumbnail — vertical reel aspect ratio */}
                <div className="relative aspect-[9/16] w-full overflow-hidden">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="180px"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      <Play className="h-5 w-5 fill-brand-darkest text-brand-darkest" />
                    </div>
                  </div>
                  {/* Title overlay */}
                  <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-3">
                    <p className="line-clamp-2 text-xs font-bold leading-tight text-white">
                      {video.title}
                    </p>
                  </div>
                </div>

                {/* Product info card at bottom */}
                {video.product && (
                  <div className="flex items-center gap-2 p-2.5">
                    <Image
                      src={video.product.image}
                      alt={video.product.name}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                    <span className="line-clamp-1 text-xs font-semibold text-text-primary">
                      {video.product.name}
                    </span>
                  </div>
                )}
                {!video.product && (
                  <div className="p-2.5">
                    <span className="text-xs font-semibold text-brand-accent">
                      Watch on Facebook
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* CTA to Facebook */}
        <div className="mt-6 text-center">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
          >
            See all videos on Facebook →
          </a>
        </div>
      </div>
    </section>
  );
}
