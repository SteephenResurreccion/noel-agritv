"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getLocalizedCategories } from "@/data/categories";
import { trackCategoryFilter } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useCopy, useLang } from "@/lib/lang-context";

export function CategoryFilter() {
  const copy = useCopy();
  const { lang } = useLang();
  // Both category names ship to the client (~100 bytes) so the pills can
  // re-localize instantly on language switch without a server round-trip.
  const categories = getLocalizedCategories(lang);
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") ?? "all";

  function handleFilter(slug: string) {
    if (slug === "all") {
      router.push("/products", { scroll: false });
    } else {
      router.push(`/products?category=${slug}`, { scroll: false });
      trackCategoryFilter(slug);
    }
  }

  const pills = [{ slug: "all", name: copy.common.filterAll }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {pills.map((pill) => (
        <button
          key={pill.slug}
          onClick={() => handleFilter(pill.slug)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            active === pill.slug
              ? "border-brand-darkest bg-brand-darkest text-white"
              : "border-border bg-surface text-text-primary hover:border-brand-accent"
          )}
        >
          {pill.name}
        </button>
      ))}
    </div>
  );
}
