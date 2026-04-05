"use client";

import { useState, useCallback } from "react";
import { Play } from "lucide-react";
import { trackVideoPlay } from "@/lib/analytics";

interface YouTubeFacadeProps {
  videoId: string;
  title: string;
  className?: string;
}

export function YouTubeFacade({ videoId, title, className }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false);

  // Sanitize videoId — only allow alphanumeric, hyphens, underscores (standard YouTube ID chars)
  const safeId = /^[\w-]{1,20}$/.test(videoId) ? videoId : "";
  const thumbnailUrl = safeId
    ? `https://i.ytimg.com/vi/${safeId}/hqdefault.jpg`
    : "";

  const handlePlay = useCallback(() => {
    setPlaying(true);
    trackVideoPlay(videoId);
  }, [videoId]);

  if (!safeId) return null;

  if (playing) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg ${className ?? ""}`}>
        <iframe
          src={`https://www.youtube.com/embed/${safeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-lg cursor-pointer group ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <button
        onClick={handlePlay}
        aria-label={`Play ${title}`}
        className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent text-white shadow-lg">
          <Play className="h-7 w-7 ml-1" />
        </span>
      </button>
    </div>
  );
}
