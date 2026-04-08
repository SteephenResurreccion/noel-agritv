"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AwardsSectionProps {
  variant?: "compact" | "full";
}

const awards = [
  { src: "/images/awards/certificates.webp", label: "Certificates of Recognition & Appreciation" },
  { src: "/images/awards/magazine-noelagritv.webp", label: "Noel AgriTV — The Art of Helping Others" },
  { src: "/images/awards/magazine-stela.webp", label: "STELA Magazine — Sustainable Farming & Humanitarian Advocate" },
  { src: "/images/awards/plaque-2024.webp", label: "2024 Excellent Filipino Awards — Outstanding Leadership in Agri Business" },
  { src: "/images/awards/plaque-recognition.webp", label: "2024 Philippines Choice Award — Humanitarian Service in Agri Business" },
  { src: "/images/awards/stela-trophy.webp", label: "STELA 2024 — Most Outstanding Agri Business Leader of the Year" },
];

export function AwardsSection({ variant = "compact" }: AwardsSectionProps) {
  const isCompact = variant === "compact";
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  function startAutoPlay() {
    if (timerRef.current) clearTimeout(timerRef.current);
    function tick() {
      if (!pausedRef.current) {
        setCurrent((c) => (c >= awards.length - 1 ? 0 : c + 1));
      }
      timerRef.current = setTimeout(tick, 4000);
    }
    timerRef.current = setTimeout(tick, 4000);
  }

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync scroll position with current index when auto-advancing
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement | undefined;
    if (!card) return;
    const cardW = card.offsetWidth;
    const gap = parseFloat(getComputedStyle(el).gap) || 0;
    const target = current * (cardW + gap);
    el.scrollTo({ left: target, behavior: "smooth" });
  }, [current]);

  function handleManual(dir: "left" | "right") {
    if (timerRef.current) clearTimeout(timerRef.current);
    pausedRef.current = true;
    setCurrent((c) => {
      if (dir === "right") return c >= awards.length - 1 ? 0 : c + 1;
      return c <= 0 ? awards.length - 1 : c - 1;
    });
    setTimeout(() => {
      pausedRef.current = false;
      startAutoPlay();
    }, 6000);
  }

  function handleDot(i: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    pausedRef.current = true;
    setCurrent(i);
    setTimeout(() => {
      pausedRef.current = false;
      startAutoPlay();
    }, 6000);
  }

  return (
    <section
      className={
        isCompact
          ? "bg-brand-darkest py-[var(--spacing-section)]"
          : "bg-bg py-[var(--spacing-section)]"
      }
    >
      {/* Heading */}
      <div className="px-[var(--spacing-container-gutter)] text-center">
        <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
          Awards &amp; Recognition
        </p>
        <h2
          className={`font-heading mt-4 text-[28px] font-bold min-[741px]:text-[36px] ${
            isCompact ? "text-white" : "text-text-primary"
          }`}
        >
          Recognized for Excellence in Filipino Agriculture
        </h2>
      </div>

      {/* Carousel */}
      <div
        className="container-site relative mx-auto mt-10"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {/* Arrows */}
        <button
          onClick={() => handleManual("left")}
          className={`absolute left-3 top-[42%] z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors min-[741px]:left-5 min-[741px]:h-12 min-[741px]:w-12 ${
            isCompact
              ? "bg-white/10 text-white/40 hover:bg-white/25 hover:text-white/90"
              : "bg-black/5 text-text-secondary/30 hover:bg-black/10 hover:text-text-primary"
          }`}
          aria-label="Previous award"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => handleManual("right")}
          className={`absolute right-3 top-[42%] z-10 flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors min-[741px]:left-auto min-[741px]:right-5 min-[741px]:h-12 min-[741px]:w-12 ${
            isCompact
              ? "bg-white/10 text-white/40 hover:bg-white/25 hover:text-white/90"
              : "bg-black/5 text-text-secondary/30 hover:bg-black/10 hover:text-text-primary"
          }`}
          aria-label="Next award"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Scrollable track — user can also swipe/scroll manually */}
        <div
          ref={trackRef}
          onTouchStart={() => { pausedRef.current = true; }}
          onTouchEnd={() => {
            setTimeout(() => {
              pausedRef.current = false;
              startAutoPlay();
            }, 5000);
          }}
          className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pl-[var(--spacing-container-gutter)] pr-[var(--spacing-container-gutter)] min-[741px]:gap-6"
        >
          {awards.map((award, i) => {
            // Highlight current, next, and the one after next
            const next1 = (current + 1) % awards.length;
            const next2 = (current + 2) % awards.length;
            const isHighlighted = i === current || i === next1 || i === next2;
            const opacity = isHighlighted ? 1 : 0.35;

            return (
              <div
                key={i}
                className="w-[36%] shrink-0 snap-start min-[741px]:w-[30%]"
                style={{
                  opacity,
                  transition: "opacity 0.8s cubic-bezier(0.33, 0, 0.2, 1)",
                }}
              >
                <div className="overflow-hidden rounded-xl">
                  <Image
                    src={award.src}
                    alt={award.label}
                    width={600}
                    height={400}
                    className="aspect-[4/5] w-full object-cover"
                    sizes="(max-width: 740px) 40vw, 38vw"
                  />
                </div>
                <p
                  className={`mt-3 text-center text-sm font-medium transition-opacity duration-700 ${
                    isCompact ? "text-white/50" : "text-text-secondary"
                  }`}
                  style={{ opacity }}
                >
                  {award.label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {awards.map((_, i) => (
            <button
              key={i}
              onClick={() => handleDot(i)}
              className={`h-2 rounded-full transition-all duration-700 ${
                i === current
                  ? "w-6 bg-brand-accent"
                  : `w-2 ${isCompact ? "bg-white/20" : "bg-text-secondary/20"}`
              }`}
              aria-label={`Go to award ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
