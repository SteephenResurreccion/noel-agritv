"use client";

import { useState } from "react";
import type { Category } from "@/data/categories";
import type { Product } from "@/data/products";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

interface HomeProductFilterProps {
  categories: Category[];
  products: Product[];
}

export function HomeProductFilter({
  categories,
  products,
}: HomeProductFilterProps) {
  const [active, setActive] = useState("all");

  const filtered =
    active === "all"
      ? products
      : products.filter((p) => p.categorySlug === active);

  const pills = [{ slug: "all", name: "All" }, ...categories];

  return (
    <>
      {/* Filter pills — TBOF style: outlined inactive, solid active */}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
        {pills.map((pill) => (
          <button
            key={pill.slug}
            onClick={() => setActive(pill.slug)}
            className={cn(
              "shrink-0 rounded-full px-8 py-3 text-[15px] font-bold transition-colors",
              active === pill.slug
                ? "bg-brand-darkest text-white"
                : "bg-brand-accent text-white hover:bg-brand-dark"
            )}
          >
            {pill.name}
          </button>
        ))}
      </div>

      {/* Product cards grid */}
      <div className="mt-6 grid grid-cols-2 gap-[var(--spacing-grid-gap)] min-[1000px]:grid-cols-4">
        {filtered.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
