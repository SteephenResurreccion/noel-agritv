"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { categories } from "@/data/categories";
import { trackCategoryFilter } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function CategoryFilter() {
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

  const pills = [{ slug: "all", name: "All" }, ...categories];

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
