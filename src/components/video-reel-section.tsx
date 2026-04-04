"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, MessageCircle } from "lucide-react";
import { FACEBOOK_URL, messengerProductLink } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface VideoItem {
  title: string;
  href: string;
  thumbnail: string;
  product?: {
    name: string;
    image: string;
    price: number;
    packSize: string;
  };
}

const videos: VideoItem[] = [
  {
    title: "Bio Plant Booster sa Dapog Day 5",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster/1465821378472117/",
    thumbnail: "/images/videos/bio-plant-booster-dapog.jpg",
    product: {
      name: "Bio Plant Booster",
      image: "/images/products/bio-plant-booster.webp",
      price: 350,
      packSize: "250ml",
    },
  },
  {
    title: "Effects of Bio Enzyme Decomposer",
    href: "https://www.facebook.com/noeltolentino2728/videos/effects-of-bio-enzyme-decomposer/1468190017709752/",
    thumbnail: "/images/videos/bio-enzyme-effects.jpg",
    product: {
      name: "Bio Enzyme",
      image: "/images/products/bio-enzyme.webp",
      price: 350,
      packSize: "250ml",
    },
  },
  {
    title: "Bio Enzyme at Organic Fertilizer",
    href: "https://www.facebook.com/noeltolentino2728/videos/tangkay-ng-guyabanobio-enzyme-at-organic-fertilizer/341631831216480/",
    thumbnail: "/images/videos/bio-enzyme-fertilizer.jpg",
    product: {
      name: "Bio Enzyme",
      image: "/images/products/bio-enzyme.webp",
      price: 350,
      packSize: "250ml",
    },
  },
  {
    title: "Bio Plant Booster at Bio Enzyme",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster-at-bio-enzyme-noelagritv-09272743281/1809173639854778/",
    thumbnail: "/images/videos/bio-plant-booster-enzyme.jpg",
    product: {
      name: "Bio Plant Booster",
      image: "/images/products/bio-plant-booster.webp",
      price: 350,
      packSize: "250ml",
    },
  },
  {
    title: "Mayumi Rice — Malapit na Hampasin Part 7",
    href: "https://www.facebook.com/noeltolentino2728/videos/mayumi-malapit-na-hampasin-part-7/1339573194848901/",
    thumbnail: "/images/products/mayumi-rice-seeds.webp",
    product: {
      name: "Mayumi Rice Seeds",
      image: "/images/products/mayumi-rice-seeds.webp",
      price: 400,
      packSize: "1kg",
    },
  },
  {
    title: "Mayumi Rice — Malapit na Hampasin Part 6",
    href: "https://www.facebook.com/noeltolentino2728/videos/mayumi-malapit-na-hampasin-part-6/1802413510416992/",
    thumbnail: "/images/products/mayumi-rice-seeds.webp",
    product: {
      name: "Mayumi Rice Seeds",
      image: "/images/products/mayumi-rice-seeds.webp",
      price: 400,
      packSize: "1kg",
    },
  },
  {
    title: "How to Control Rice Black Bugs",
    href: "https://www.facebook.com/noeltolentino2728/videos/how-to-control-rice-black-bugs/1150412736514923/",
    thumbnail: "/images/videos/rice-black-bugs.jpg",
    product: {
      name: "Jasmine 479 Seeds",
      image: "/images/products/jasmine-479-rice-seeds.webp",
      price: 450,
      packSize: "1kg",
    },
  },
  {
    title: "Rice Pruning — Tinesting Natin",
    href: "https://www.facebook.com/noeltolentino2728/videos/749528474756504/",
    thumbnail: "/images/videos/rice-pruning.jpg",
    product: {
      name: "Jasmine 479 Seeds",
      image: "/images/products/jasmine-479-rice-seeds.webp",
      price: 450,
      packSize: "1kg",
    },
  },
];

export function VideoReelSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative overflow-hidden bg-[#f3f0d2]/40 py-[var(--spacing-section)]">
      {/* Decorative organic shapes — TBOF style */}
      <svg
        className="absolute -left-8 -top-4 h-24 w-48 text-brand-accent/20"
        viewBox="0 0 200 100"
        fill="currentColor"
        aria-hidden="true"
      >
        <ellipse cx="60" cy="50" rx="80" ry="45" />
        <ellipse cx="150" cy="40" rx="50" ry="30" />
      </svg>
      <svg
        className="absolute -bottom-6 -right-6 h-20 w-40 text-brand-accent/15"
        viewBox="0 0 160 80"
        fill="currentColor"
        aria-hidden="true"
      >
        <ellipse cx="80" cy="40" rx="70" ry="38" />
        <ellipse cx="140" cy="50" rx="30" ry="20" />
      </svg>

      {/* Heading — centered, inside container */}
      <div className="px-[var(--spacing-container-gutter)]">
        <h2 className="text-center text-[26px] font-bold italic text-brand-darkest min-[741px]:text-[36px]">
          See It From the Farm — Come Take a Peek!
        </h2>
      </div>

      {/* Full-bleed carousel — extends to viewport edges like TBOF */}
      <div className="relative mt-10">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-[35%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-text-primary" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-[35%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-text-primary" />
        </button>

        {/* Scrollable track — full width, no container constraint */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-5 overflow-x-auto pl-[var(--spacing-container-gutter)] pr-4 pb-4"
        >
          {videos.map((video, i) => (
            <div
              key={i}
              className="w-[185px] shrink-0 overflow-hidden rounded-2xl border border-brand-accent/20 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              {/* Video thumbnail with title overlay */}
              <a
                href={video.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-[9/16] w-full overflow-hidden"
              >
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="185px"
                />
                {/* Title overlay at top */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent px-3 pb-8 pt-3">
                  <p className="line-clamp-2 text-[11px] font-bold uppercase leading-tight tracking-wide text-white drop-shadow-sm">
                    {video.title}
                  </p>
                </div>
                {/* Play button — TBOF: dark semi-transparent circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-black/50 transition-colors group-hover:bg-black/60">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </div>
                </div>
              </a>

              {/* Product info card at bottom */}
              {video.product && (
                <div className="border-t border-brand-accent/10 px-2.5 pb-2.5 pt-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={video.product.image}
                      alt={video.product.name}
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 rounded-full border border-border/40 object-cover"
                    />
                    <span className="line-clamp-1 text-[11px] font-semibold text-text-primary">
                      {video.product.name}
                    </span>
                  </div>
                  <p className="mt-1 pl-9 text-xs font-bold text-text-primary">
                    {formatPrice(video.product.price)}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <a
                      href={messengerProductLink(
                        video.product.name,
                        video.product.packSize
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-1 rounded bg-brand-accent py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-mid"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Message
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA to Facebook — centered */}
      <div className="mt-4 text-center">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
        >
          See all videos on Facebook →
        </a>
      </div>
    </section>
  );
}
