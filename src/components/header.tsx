"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Menu } from "lucide-react";
import { products } from "@/data/products";
import { categories } from "@/data/categories";

const TRENDING_SEARCHES = [
  "Bio Plant Booster",
  "Bio Enzyme",
  "Rice Seeds",
  "Jasmine",
  "Mayumi",
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);

  // Filter products based on query
  const results =
    query.length >= 2
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.oneLiner.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close search on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchOverlayRef.current &&
        !searchOverlayRef.current.contains(e.target as Node)
      ) {
        closeSearch();
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen, closeSearch]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") closeSearch();
    }
    if (searchOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [searchOpen, closeSearch]);

  function handleNavClick() {
    setMobileMenuOpen(false);
  }

  function handleTrendingClick(term: string) {
    setQuery(term);
    if (searchInputRef.current) searchInputRef.current.focus();
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-sm">
        <div className="container-site">
          {/* Main header row — 3-column grid */}
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center md:h-[72px]">
            {/* Left — Search (desktop: input, mobile: hamburger) */}
            <div className="flex items-center">
              {/* Desktop search trigger */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden h-10 w-[280px] items-center justify-between rounded-md border border-text-primary/30 px-4 text-sm text-text-secondary/50 transition-colors hover:border-text-primary/50 md:flex"
                aria-label="Search products"
              >
                <span>Search products...</span>
                <Search className="h-4 w-4" />
              </button>

              {/* Mobile: hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 text-text-primary" />
              </button>
            </div>

            {/* Center — Logo */}
            <Link href="/" className="flex items-center justify-center">
              <Image
                src="/images/NewLogo.png"
                alt="Noel AgriTV"
                width={120}
                height={120}
                className="h-10 w-10 md:h-14 md:w-14"
                priority
              />
            </Link>

            {/* Right — Desktop nav links + Mobile search icon */}
            <div className="flex items-center justify-end">
              {/* Desktop nav */}
              <nav
                className="hidden items-center gap-8 md:flex"
                aria-label="Main navigation"
              >
                <Link
                  href="/products"
                  className="text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:text-brand-accent"
                >
                  Products
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:text-brand-accent"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:text-brand-accent"
                >
                  Contact
                </Link>
              </nav>

              {/* Mobile search icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-text-primary" />
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* ── Search overlay — full-screen on mobile, dropdown on desktop ── */}
      {searchOpen && (
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
                  placeholder="Search products..."
                  className="h-12 w-full rounded-md border border-border bg-bg pl-9 pr-4 text-base text-text-primary placeholder:text-text-secondary/60 focus:border-brand-accent focus:outline-none md:h-10 md:text-sm"
                />
              </div>
              <button
                onClick={closeSearch}
                className="flex h-12 items-center px-3 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary"
              >
                <X className="h-5 w-5 md:hidden" />
                <span className="hidden md:inline">Close</span>
              </button>
            </div>

            {/* Active search results */}
            {query.length >= 2 ? (
              <div className="mt-4">
                {results.length > 0 ? (
                  <>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                      Products
                    </p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {results.map((product) => (
                        <Link
                          key={product.slug}
                          href={`/products/${product.slug}`}
                          onClick={closeSearch}
                          className="group rounded-lg border border-border bg-bg p-3 transition-shadow hover:shadow-md"
                        >
                          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-md">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              sizes="150px"
                            />
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {product.oneLiner}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="py-8 text-center text-sm text-text-secondary">
                    No products found for &ldquo;{query}&rdquo;
                  </p>
                )}
              </div>
            ) : (
              /* Default state: trending + categories + top products */
              <div className="mt-4 space-y-6">
                {/* Trending Searches */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                    Trending Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((term) => (
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
                    Shop By Category
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
                    Top Products
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {products.slice(0, 5).map((product) => (
                      <Link
                        key={product.slug}
                        href={`/products/${product.slug}`}
                        onClick={closeSearch}
                        className="group rounded-lg border border-border bg-bg p-3 transition-shadow hover:shadow-md"
                      >
                        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-md">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            sizes="150px"
                          />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-semibold text-text-primary">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-brand-accent">
                          ₱{product.variants[0].price.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {product.variants[0].packSize}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-in panel */}
          <div className="absolute inset-y-0 left-0 w-[300px] bg-surface shadow-xl">
            {/* Panel header */}
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Image
                src="/images/NewLogo.png"
                alt="Noel AgriTV"
                width={80}
                height={80}
                className="h-9 w-9"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-text-primary" />
              </button>
            </div>

            {/* Mobile nav links */}
            <nav className="p-4" aria-label="Mobile navigation">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    Products
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
