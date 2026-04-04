"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { FACEBOOK_URL } from "@/lib/constants";

interface VideoItem {
  title: string;
  href: string;
  thumbnail: string;
}

const videos: VideoItem[] = [
  {
    title: "Bio Plant Booster sa Dapog Day 5",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster/1465821378472117/",
    thumbnail: "/images/videos/bio-plant-booster-dapog.jpg",
  },
  {
    title: "Effects of Bio Enzyme Decomposer",
    href: "https://www.facebook.com/noeltolentino2728/videos/effects-of-bio-enzyme-decomposer/1468190017709752/",
    thumbnail: "/images/videos/bio-enzyme-effects.jpg",
  },
  {
    title: "Malunggay Leaves — Vitamins, Minerals & Anti-Oxidant",
    href: "https://www.facebook.com/noeltolentino2728/videos/2614786298831342/",
    thumbnail: "/images/videos/malunggay-leaves.jpg",
  },
  {
    title: "Bio Plant Booster at Bio Enzyme",
    href: "https://www.facebook.com/noeltolentino2728/videos/bio-plant-booster-at-bio-enzyme-noelagritv-09272743281/1809173639854778/",
    thumbnail: "/images/videos/bio-plant-booster-enzyme.jpg",
  },
  {
    title: "Tamang Binhi ng Palay — Susi sa Matagumpay na Pagsasaka",
    href: "https://www.facebook.com/noeltolentino2728/videos/475991483603519/",
    thumbnail: "/images/videos/tamang-binhi-palay.jpg",
  },
  {
    title: "Bio Enzyme at Organic Fertilizer",
    href: "https://www.facebook.com/noeltolentino2728/videos/tangkay-ng-guyabanobio-enzyme-at-organic-fertilizer/341631831216480/",
    thumbnail: "/images/videos/bio-enzyme-fertilizer.jpg",
  },
  {
    title: "Gayahin Nyo To — Tapos na ang Problema",
    href: "https://www.facebook.com/noeltolentino2728/videos/279852637396827/",
    thumbnail: "/images/videos/gayahin-nyo-to.jpg",
  },
  {
    title: "Salvador Herbicide sa Organic Fertilizer Demo",
    href: "https://www.facebook.com/noeltolentino2728/videos/1033617557363767/",
    thumbnail: "/images/videos/salvador-herbicide.jpg",
  },
  {
    title: "How to Control Rice Black Bugs",
    href: "https://www.facebook.com/noeltolentino2728/videos/how-to-control-rice-black-bugs/1150412736514923/",
    thumbnail: "/images/videos/rice-black-bugs.jpg",
  },
  {
    title: "Bio Enzyme — Hindi Lang Pang Palay, Pang Gulay Din",
    href: "https://www.facebook.com/noeltolentino2728/videos/8830268730405322/",
    thumbnail: "/images/videos/bio-enzyme-gulay.jpg",
  },
  {
    title: "Pang Lusaw ng Dayami sa Palayan",
    href: "https://www.facebook.com/noeltolentino2728/videos/184244193810948/",
    thumbnail: "/images/videos/dayami-palayan.jpg",
  },
  {
    title: "Lettuce Farming Ideas sa Taniman ng Palay",
    href: "https://www.facebook.com/noeltolentino2728/videos/901509578604325/",
    thumbnail: "/images/videos/lettuce-farming.jpg",
  },
  {
    title: "Rice Pruning — Tinesting Natin",
    href: "https://www.facebook.com/noeltolentino2728/videos/749528474756504/",
    thumbnail: "/images/videos/rice-pruning.jpg",
  },
  {
    title: "AgriTV at Philippine Livestock 2023",
    href: "https://www.facebook.com/noeltolentino2728/videos/893734876756430/",
    thumbnail: "/images/videos/philippine-livestock.jpg",
  },
  {
    title: "Mayumi Rice — Malapit na Hampasin",
    href: "https://www.facebook.com/noeltolentino2728/videos/mayumi-malapit-na-hampasin-part-7/1339573194848901/",
    thumbnail: "/images/products/mayumi-rice-seeds.webp",
  },
];

export function VideoReelSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative overflow-hidden bg-[#f3f0d2]/40 py-[var(--spacing-section)]">
      {/* Decorative organic shapes */}
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

      {/* Heading */}
      <div className="px-[var(--spacing-container-gutter)]">
        <h2 className="text-center text-[26px] font-bold italic text-brand-darkest min-[741px]:text-[36px]">
          See It From the Farm — Come Take a Peek!
        </h2>
      </div>

      {/* Full-bleed carousel */}
      <div className="relative mt-10">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-text-primary" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-text-primary" />
        </button>

        {/* Scrollable track — full bleed */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pl-[var(--spacing-container-gutter)] pb-2"
        >
          {videos.map((video, i) => (
            <a
              key={i}
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-[170px] shrink-0 overflow-hidden rounded-2xl border border-brand-accent/20 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              {/* Video thumbnail */}
              <div className="relative aspect-[9/16] w-full overflow-hidden">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="170px"
                />
                {/* Title overlay at top */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent px-3 pb-10 pt-3">
                  <p className="line-clamp-3 text-[11px] font-bold uppercase leading-tight tracking-wide text-white drop-shadow-sm">
                    {video.title}
                  </p>
                </div>
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-black/50 transition-colors group-hover:bg-black/60">
                    <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                  </div>
                </div>
              </div>
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
    </section>
  );
}
