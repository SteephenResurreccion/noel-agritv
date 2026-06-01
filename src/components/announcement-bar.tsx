import Link from "next/link";
import { FACEBOOK_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export type AnnouncementItem = {
  text: string;
  href: string;
  external?: boolean;
};

export async function AnnouncementBar({
  announcements,
  direction = "left",
}: {
  announcements?: AnnouncementItem[];
  direction?: "left" | "right";
} = {}) {
  const copy = getCopy(await getLangFromRequest());
  const defaultAnnouncements: AnnouncementItem[] = [
    { text: copy.announcementBar.items[0], href: "/products" },
    { text: copy.announcementBar.items[1], href: FACEBOOK_URL, external: true },
    { text: copy.announcementBar.items[2], href: "/about" },
  ];
  const resolvedAnnouncements = announcements ?? defaultAnnouncements;
  // Duplicate 4x for seamless loop on wide screens
  const items = [...resolvedAnnouncements, ...resolvedAnnouncements, ...resolvedAnnouncements, ...resolvedAnnouncements];

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
