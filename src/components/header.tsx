import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="container-site flex h-14 items-center justify-between">
        {/* Mobile: centered logo */}
        <Link
          href="/"
          className="text-lg font-bold text-brand-darkest max-md:mx-auto"
        >
          NOEL AGRI<span className="text-brand-accent">TV</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-6 md:flex" aria-label="Main navigation">
          <Link
            href="/products"
            className="text-sm font-semibold text-text-primary hover:text-brand-accent"
          >
            Products
          </Link>
          <Link
            href="/about"
            className="text-sm font-semibold text-text-primary hover:text-brand-accent"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold text-text-primary hover:text-brand-accent"
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  );
}
