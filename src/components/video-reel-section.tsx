"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { FACEBOOK_URL } from "@/lib/constants";
import { useCopy } from "@/lib/lang-context";
import { CornerTree } from "@/components/corner-tree";

interface VideoItem {
  title: string;
  href: string;
  thumbnail: string;
}

export function VideoReelSection({ videos }: { videos: VideoItem[] }) {
  const copy = useCopy();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (videos.length === 0) return null;

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
      {/* Airy corner trees — square art, anchored to corners and bleeding off-edge (cropped by section overflow-hidden) */}
      <CornerTree
        corner="tl"
        className="pointer-events-none absolute left-0 top-0 z-0 h-[180px] w-[180px] -translate-x-[20%] -translate-y-[20%] min-[741px]:h-[240px] min-[741px]:w-[240px]"
      />
      <CornerTree
        corner="br"
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-[180px] w-[180px] translate-x-[20%] translate-y-[20%] min-[741px]:h-[240px] min-[741px]:w-[240px]"
      />

      {/* Heading */}
      <div className="relative z-10 px-[var(--spacing-container-gutter)]">
        <h2 className="text-center text-[26px] font-bold italic text-brand-darkest min-[741px]:text-[36px]">
          {copy.videoReel.title}
        </h2>
      </div>

      {/* Full-bleed carousel */}
      <div className="relative z-10 mt-10">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label={copy.videoReel.scrollLeftAriaLabel}
        >
          <ChevronLeft className="h-5 w-5 text-text-primary" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white shadow-md transition-colors hover:bg-gray-50 md:flex"
          aria-label={copy.videoReel.scrollRightAriaLabel}
        >
          <ChevronRight className="h-5 w-5 text-text-primary" />
        </button>

        {/* Scrollable track — full bleed */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pl-[var(--spacing-container-gutter)] pr-[var(--spacing-container-gutter)] pb-2"
        >
          {videos.map((video) => (
            <a
              key={video.title}
              href={video.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-[170px] shrink-0 overflow-hidden rounded-2xl border border-brand-accent/20 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              {/* Video thumbnail */}
              <div className="relative aspect-[9/16] w-full overflow-hidden">
                {video.thumbnail.startsWith("http") || video.thumbnail.startsWith("/api/blob-image") ? (
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
      <div className="relative z-10 mt-6 text-center">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:underline"
        >
          {copy.videoReel.seeAllOnFacebook}
        </a>
      </div>
    </section>
  );
}
