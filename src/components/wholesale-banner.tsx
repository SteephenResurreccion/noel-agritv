import Link from "next/link";
import { MESSENGER_WHOLESALE_URL } from "@/lib/constants";

export function WholesaleBanner() {
  return (
    <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
      <div className="container-site mx-auto max-w-2xl text-center">
        <p className="font-heading text-[26px] font-bold italic leading-snug text-white min-[741px]:text-[36px]">
          Volume discounts on all products.
          <br />
          Nationwide delivery via J&T.
        </p>
        <div className="mt-8">
          <Link
            href={MESSENGER_WHOLESALE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Inquire for Wholesale
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
