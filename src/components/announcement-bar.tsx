import Link from "next/link";
import { FACEBOOK_URL } from "@/lib/constants";

export type AnnouncementItem = {
  text: string;
  href: string;
  external?: boolean;
};

const defaultAnnouncements: AnnouncementItem[] = [
  { text: "Bio-organic products trusted by 250k+ Filipino farmers", href: "/products" },
  { text: "Message us on Facebook to order — nationwide delivery via J&T", href: FACEBOOK_URL, external: true },
  { text: "Natural crop care solutions since 2021", href: "/about" },
];

export function AnnouncementBar({
  announcements = defaultAnnouncements,
  direction = "left",
}: {
  announcements?: AnnouncementItem[];
  direction?: "left" | "right";
} = {}) {
  // Duplicate 4x for seamless loop on wide screens
  const items = [...announcements, ...announcements, ...announcements, ...announcements];

  return (
    <div className="overflow-hidden bg-brand-darkest text-white">
      <div className={`flex w-max items-center gap-12 py-2.5 ${direction === "right" ? "announcement-track-reverse" : "announcement-track"}`}>
        {items.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-3">
            <span className="text-brand-accent">●</span>
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap text-xs font-semibold tracking-wide text-white/90 hover:text-white"
              >
                {item.text}
              </a>
            ) : (
              <Link
                href={item.href}
                className="whitespace-nowrap text-xs font-semibold tracking-wide text-white/90 hover:text-white"
              >
                {item.text}
              </Link>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
