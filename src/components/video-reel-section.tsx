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

export function VideoReelSection({ videos }: { videos: VideoItem[] }) {
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
      {/* Tree top-left — diagonal trunk from bottom-left corner, wide flat canopy */}
      <svg
        className="pointer-events-none absolute left-0 top-0 h-[180px] w-[160px] -translate-x-[20%] min-[741px]:h-[240px] min-[741px]:w-[210px]"
        viewBox="0 0 210 200"
        fill="none"
        aria-hidden="true"
      >
        {/* Diagonal trunk — brown, from bottom-left to canopy */}
        <path d="M0 200 L8 195 L55 125 L45 118Z" fill="#8B6F47" />
        {/* Wide flat canopy — muted green, acacia/umbrella shape */}
        <path
          d="M30 120 Q20 85 35 60 Q50 38 90 28 Q130 18 170 35 Q200 50 195 80 Q190 108 155 118 Q120 128 80 125 Q50 122 30 120Z"
          fill="#6B8F5E"
        />
        {/* Darker inner canopy for depth */}
        <path
          d="M45 112 Q38 85 52 65 Q68 45 100 38 Q135 30 160 45 Q180 58 176 80 Q172 100 145 108 Q115 116 80 114 Q58 112 45 112Z"
          fill="#4D734C"
        />
        {/* Accent dot */}
        <circle cx="155" cy="42" r="7" fill="#3B593F" fillOpacity="0.6" />
      </svg>

      {/* Tree bottom-right — diagonal trunk from bottom-right corner, wide flat canopy */}
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-[170px] w-[150px] translate-x-[20%] min-[741px]:h-[220px] min-[741px]:w-[195px]"
        viewBox="0 0 195 190"
        fill="none"
        aria-hidden="true"
      >
        {/* Diagonal trunk — brown, from bottom-right to canopy */}
        <path d="M195 190 L187 185 L140 118 L150 112Z" fill="#8B6F47" />
        {/* Wide flat canopy — muted green */}
        <path
          d="M165 115 Q175 80 160 55 Q145 32 105 22 Q65 12 25 30 Q-5 45 0 75 Q5 103 40 113 Q75 123 115 120 Q145 117 165 115Z"
          fill="#6B8F5E"
        />
        {/* Darker inner canopy */}
        <path
          d="M150 108 Q158 80 145 60 Q130 40 95 32 Q60 24 35 38 Q15 50 18 72 Q22 94 50 104 Q80 112 115 110 Q138 108 150 108Z"
          fill="#4D734C"
        />
        {/* Leaf accent */}
        <path d="M32 38 Q42 22 36 5 Q50 20 38 36Z" fill="#3B593F" fillOpacity="0.5" />
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
                {video.thumbnail.startsWith("/api/blob-image") ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="170px"
                  />
                )}
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
