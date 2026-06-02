"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X } from "lucide-react";
import type { Category } from "@/data/categories";
import type { Copy } from "@/lib/copy";

interface SearchProduct {
  slug: string;
  name: string;
  oneLiner: string;
  image: string;
}

interface HeaderSearchOverlayProps {
  copy: Copy;
  query: string;
  setQuery: (value: string) => void;
  results: SearchProduct[];
  categories: Category[];
  searchProducts: SearchProduct[];
  trendingSearches: readonly string[];
  closeSearch: () => void;
  handleTrendingClick: (term: string) => void;
  // Refs are owned by the parent Header so its useEffects (auto-focus,
  // click-outside, Escape) keep working after this overlay is lazily mounted.
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchOverlayRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Card markup shared by the active-results grid and the top-products grid.
 * Identical to the original two inline copies in header.tsx; `showOneLiner`
 * matches the original (results show the one-liner, top-products do not).
 */
function SearchProductCard({
  product,
  showOneLiner,
  onClick,
}: {
  product: SearchProduct;
  showOneLiner: boolean;
  onClick: () => void;
}) {
  const isRemote =
    product.image.startsWith("/api/blob-image") || product.image.startsWith("http");
  return (
    <Link
      href={`/products/${product.slug}`}
      onClick={onClick}
      className="group rounded-lg border border-border bg-bg p-3 transition-shadow hover:shadow-md"
    >
      <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-md">
        {isRemote ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="150px"
          />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
        {product.name}
      </p>
      {showOneLiner && (
        <p className="mt-0.5 text-xs text-text-secondary">{product.oneLiner}</p>
      )}
    </Link>
  );
}

export function HeaderSearchOverlay({
  copy,
  query,
  setQuery,
  results,
  categories,
  searchProducts,
  trendingSearches,
  closeSearch,
  handleTrendingClick,
  searchInputRef,
  searchOverlayRef,
}: HeaderSearchOverlayProps) {
  // Focus-race fix: this overlay is mounted via next/dynamic, so on the FIRST
  // open after a cold load the parent's searchOpen-keyed focus effect can run
  // before this input exists. Focus on mount here as well; subsequent re-opens
  // are still handled by the parent effect (the chunk is already loaded then).
  useEffect(() => {
    searchInputRef.current?.focus();
  }, [searchInputRef]);

  return (
    <div
      ref={searchOverlayRef}
      className="fixed inset-0 z-50 overflow-y-auto bg-surface"
    >
      <div className="container-site py-4">
        {/* Search input row + Close */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.header.searchProductsPlaceholder}
              className="h-12 w-full rounded-md border border-border bg-bg pl-9 pr-4 text-base text-text-primary placeholder:text-text-secondary/60 focus:border-brand-accent focus:outline-none md:h-10 md:text-sm"
            />
          </div>
          <button
            onClick={closeSearch}
            className="flex h-12 items-center px-3 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <X className="h-5 w-5 md:hidden" />
            <span className="hidden md:inline">{copy.header.close}</span>
          </button>
        </div>

        {/* Active search results */}
        {query.length >= 2 ? (
          <div className="mt-4">
            {results.length > 0 ? (
              <>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  {copy.header.productsHeading}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {results.map((product) => (
                    <SearchProductCard
                      key={product.slug}
                      product={product}
                      showOneLiner
                      onClick={closeSearch}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="py-8 text-center text-sm text-text-secondary">
                {copy.header.noResults(query)}
              </p>
            )}
          </div>
        ) : (
          /* Default state: trending + categories + top products */
          <div className="mt-4 space-y-6">
            {/* Trending Searches */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {copy.header.trendingSearches}
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleTrendingClick(term)}
                    className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent md:px-3 md:py-1.5 md:text-xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Shop By Category */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {copy.header.shopByCategory}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    onClick={closeSearch}
                    className="inline-flex items-center gap-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 px-4 py-2 text-sm font-semibold text-brand-accent transition-colors hover:bg-brand-accent/10 md:py-1.5 md:text-xs"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {copy.header.topProducts}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {searchProducts.slice(0, 5).map((product) => (
                  <SearchProductCard
                    key={product.slug}
                    product={product}
                    showOneLiner={false}
                    onClick={closeSearch}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
