import Link from "next/link";
import { MESSENGER_WHOLESALE_URL, PHONE_TEL, PHONE_NUMBER } from "@/lib/constants";

const benefits = [
  "Volume discounts available",
  "Nationwide delivery via J&T",
  "All products available in bulk",
  "Message us on Facebook or call to inquire",
];

export function WholesaleBanner() {
  return (
    <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
      <div className="container-site mx-auto max-w-xl text-center">
        <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
          Wholesale
        </p>
        <h2 className="mt-4 text-[28px] font-bold text-white min-[741px]:text-[36px]">
          Buying in Bulk? We&apos;ve Got You Covered
        </h2>
        <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
          {benefits.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/70">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href={MESSENGER_WHOLESALE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] bg-brand-accent px-8 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Message Us for Wholesale →
          </Link>
          <Link
            href={PHONE_TEL}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] border border-white/20 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Call {PHONE_NUMBER}
          </Link>
        </div>
      </div>
    </section>
  );
}
