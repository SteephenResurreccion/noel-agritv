"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Menu } from "lucide-react";
import { products } from "@/data/products";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter products based on query
  const results =
    query.length >= 2
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.oneLiner.toLowerCase().includes(query.toLowerCase())
        )
      : [];

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
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        setQuery("");
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  // Close mobile menu on route change (link click)
  function handleNavClick() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-sm">
        <div className="container-site">
          {/* Main header row — 3-column grid */}
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center md:h-[72px]">
            {/* Left — Search (desktop: input, mobile: icon) */}
            <div className="flex items-center" ref={searchContainerRef}>
              {/* Desktop search input */}
              <div className="relative hidden md:block">
                {searchOpen ? (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products..."
                      className="h-9 w-[280px] rounded-md border border-border bg-bg pl-9 pr-8 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-brand-accent focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setQuery("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      aria-label="Close search"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    {/* Search results dropdown */}
                    {query.length >= 2 && (
                      <div className="absolute left-0 top-full z-50 mt-1 w-[320px] rounded-lg border border-border bg-surface shadow-lg">
                        {results.length > 0 ? (
                          <ul className="max-h-[320px] overflow-y-auto py-2">
                            {results.map((product) => (
                              <li key={product.slug}>
                                <Link
                                  href={`/products/${product.slug}`}
                                  onClick={() => {
                                    setSearchOpen(false);
                                    setQuery("");
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg"
                                >
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="h-10 w-10 rounded-md object-cover"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-text-primary">
                                      {product.name}
                                    </p>
                                    <p className="truncate text-xs text-text-secondary">
                                      {product.oneLiner}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="px-4 py-6 text-center text-sm text-text-secondary">
                            No products found
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="flex h-9 items-center gap-2 rounded-md border border-border bg-bg px-3 text-sm text-text-secondary/60 transition-colors hover:border-brand-accent/40 hover:text-text-secondary"
                    aria-label="Search products"
                  >
                    <Search className="h-4 w-4" />
                    <span>Search products...</span>
                  </button>
                )}
              </div>

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
                src="/images/Use this for logo.png"
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
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center md:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-text-primary" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
                src="/images/Use this for logo.png"
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

            {/* Mobile search */}
            <div className="border-b border-border p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products..."
                  className="h-10 w-full rounded-md border border-border bg-bg pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary/60 focus:border-brand-accent focus:outline-none"
                />
              </div>

              {/* Mobile search results */}
              {query.length >= 2 && (
                <div className="mt-2 max-h-[200px] overflow-y-auto rounded-md border border-border bg-bg">
                  {results.length > 0 ? (
                    <ul>
                      {results.map((product) => (
                        <li key={product.slug}>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={() => {
                              setQuery("");
                              handleNavClick();
                            }}
                            className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface"
                          >
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded object-cover"
                            />
                            <p className="truncate text-sm font-medium text-text-primary">
                              {product.name}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-4 text-center text-sm text-text-secondary">
                      No products found
                    </p>
                  )}
                </div>
              )}
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
