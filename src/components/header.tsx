import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/95 backdrop-blur-sm">
      <div className="container-site flex h-14 items-center justify-between md:h-[72px]">
        {/* Mobile: centered logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-brand-darkest max-md:mx-auto"
        >
          NOEL AGRI<span className="text-brand-accent">TV</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden gap-8 md:flex" aria-label="Main navigation">
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
      </div>
    </header>
  );
}
