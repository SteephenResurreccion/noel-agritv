"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Menu } from "lucide-react";
import { getLocalizedCategories } from "@/data/categories";
import { CartBadge } from "@/components/cart-badge";
import { LangSwitcher } from "@/components/lang-switcher";
import { useCopy, useLang } from "@/lib/lang-context";

interface SearchProduct {
  slug: string;
  name: string;
  oneLiner: string;
  image: string;
}

export function Header({ searchProducts = [] }: { searchProducts?: SearchProduct[] }) {
  const copy = useCopy();
  const { lang } = useLang();
  // Category pills re-localize client-side on language switch (~100 bytes).
  const categories = getLocalizedCategories(lang);
  const TRENDING_SEARCHES = copy.header.trendingTerms;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);

  // Filter products based on query
  const results =
    query.length >= 2
      ? searchProducts.filter(
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
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-sm lg:border-b-brand-darkest/10 lg:bg-surface lg:backdrop-blur-none lg:shadow-[0_1px_0_rgba(28,41,32,0.02),0_8px_24px_-18px_rgba(28,41,32,0.45)]">
        <div className="container-site">
          {/* Main header row — 3-column grid */}
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center lg:h-[74px]">
            {/* Left — Search (desktop: icon + label, mobile: hamburger) */}
            <div className="flex items-center">
              {/* Desktop search trigger — icon + uppercase label */}
              <button
                onClick={() => setSearchOpen(true)}
                className="group hidden h-[42px] items-center gap-[9px] text-text-secondary transition-colors hover:text-text-primary lg:flex"
                aria-label={copy.header.searchProductsAriaLabel}
              >
                <Search className="h-[18px] w-[18px] text-brand-darkest" strokeWidth={1.6} />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                  {copy.header.searchLabel}
                </span>
              </button>

              {/* Mobile: hamburger menu */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center lg:hidden"
                aria-label={copy.header.openMenuAriaLabel}
              >
                <Menu className="h-5 w-5 text-text-primary" />
              </button>
            </div>

            {/* Center — Logo (mobile) / wordmark lockup (desktop) */}
            <Link href="/" className="flex items-center justify-center" aria-label={copy.header.logoAlt}>
              {/* Mobile: lone emblem */}
              <Image
                src="/images/whitebglogo.png"
                alt={copy.header.logoAlt}
                width={120}
                height={120}
                className="h-10 w-10 lg:hidden"
                priority
              />
              {/* Desktop: emblem (30px) + two-tone serif wordmark */}
              <span className="hidden items-center gap-3 lg:flex">
                <Image
                  src="/images/whitebglogo.png"
                  alt=""
                  aria-hidden="true"
                  width={120}
                  height={120}
                  className="h-[30px] w-[30px]"
                  priority
                />
                <span className="font-heading text-[30px] font-bold uppercase leading-none tracking-[0.06em]">
                  <span className="text-brand-darkest">Noel</span>
                  <span className="text-brand-accent">&nbsp;AgriTV</span>
                </span>
              </span>
            </Link>

            {/* Right — Lang switcher + Cart + Mobile search icon.
                Desktop nav moved to row 2 below so it no longer influences
                the centered logo (which would otherwise shift between
                languages as the variable-width nav grew/shrank). */}
            <div className="flex items-center justify-end">
              {/* Language switcher (desktop only — mobile lives in the drawer) */}
              <div className="ml-4 hidden lg:block">
                <LangSwitcher />
              </div>

              {/* Cart badge */}
              <CartBadge />

              {/* Mobile search icon */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex h-10 w-10 items-center justify-center lg:hidden"
                aria-label={copy.header.searchAriaLabel}
              >
                <Search className="h-5 w-5 text-text-primary" />
              </button>
            </div>
          </div>

          {/* Row 2 — Desktop nav (lg+ only), centered across the full
              container width. Decoupled from the logo so its variable label
              widths (Filipino runs ~40% longer) never push the logo off
              center. */}
          <nav
            className="hidden h-11 items-center justify-center gap-[30px] border-t border-brand-darkest/[0.07] lg:flex"
            aria-label={copy.header.mainNavAriaLabel}
          >
            <Link
              href="/products"
              className="whitespace-nowrap border-b-[1.5px] border-transparent pb-0.5 text-[12.5px] font-semibold uppercase tracking-[0.13em] text-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              {copy.common.productsNav}
            </Link>
            <Link
              href="/about"
              className="whitespace-nowrap border-b-[1.5px] border-transparent pb-0.5 text-[12.5px] font-semibold uppercase tracking-[0.13em] text-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              {copy.header.navAbout}
            </Link>
            <Link
              href="/contact"
              className="whitespace-nowrap border-b-[1.5px] border-transparent pb-0.5 text-[12.5px] font-semibold uppercase tracking-[0.13em] text-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              {copy.header.navContact}
            </Link>
            <Link
              href="/lookup"
              className="whitespace-nowrap border-b-[1.5px] border-transparent pb-0.5 text-[12.5px] font-semibold uppercase tracking-[0.13em] text-text-primary transition-colors hover:border-brand-accent hover:text-brand-accent"
            >
              {copy.common.findMyOrder}
            </Link>
          </nav>
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
                        <Link
                          key={product.slug}
                          href={`/products/${product.slug}`}
                          onClick={closeSearch}
                          className="group rounded-lg border border-border bg-bg p-3 transition-shadow hover:shadow-md"
                        >
                          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-md">
                            {product.image.startsWith("/api/blob-image") || product.image.startsWith("http") ? (
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
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {product.oneLiner}
                          </p>
                        </Link>
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
                      <Link
                        key={product.slug}
                        href={`/products/${product.slug}`}
                        onClick={closeSearch}
                        className="group rounded-lg border border-border bg-bg p-3 transition-shadow hover:shadow-md"
                      >
                        <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-md">
                          {product.image.startsWith("/api/blob-image") || product.image.startsWith("http") ? (
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
        <div className="fixed inset-0 z-50 lg:hidden">
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
                src="/images/whitebglogo.png"
                alt={copy.header.logoAlt}
                width={80}
                height={80}
                className="h-9 w-9"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center"
                aria-label={copy.header.closeMenuAriaLabel}
              >
                <X className="h-5 w-5 text-text-primary" />
              </button>
            </div>

            {/* Mobile nav links */}
            <nav className="p-4" aria-label={copy.header.mobileNavAriaLabel}>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    {copy.header.navHome}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    {copy.common.productsNav}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    {copy.header.navAbout}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    {copy.header.navContact}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/lookup"
                    onClick={handleNavClick}
                    className="block rounded-md px-3 py-3 text-sm font-semibold uppercase tracking-wide text-text-primary transition-colors hover:bg-bg hover:text-brand-accent"
                  >
                    {copy.common.findMyOrder}
                  </Link>
                </li>
              </ul>

              {/* Language switcher inside the mobile drawer.
                  Heading is hardcoded bilingual ("Wika / Language") — it is
                  language-neutral by design (same rationale as the FIL/EN
                  labels), so it is not threaded through copy.ts. */}
              <div className="mt-4 border-t border-border px-3 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-text-secondary">
                  Wika / Language
                </p>
                <LangSwitcher />
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
