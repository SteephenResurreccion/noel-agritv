import Link from "next/link";
import { MESSENGER_WHOLESALE_URL, PHONE_TEL, PHONE_NUMBER } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export async function WholesaleBanner() {
  const copy = getCopy(await getLangFromRequest());
  const benefits = copy.wholesaleBanner.benefits;
  return (
    <section className="bg-brand-darkest px-[var(--spacing-container-gutter)] py-[var(--spacing-section)]">
      <div className="container-site mx-auto max-w-xl text-center">
        <p className="text-[length:var(--font-size-meta)] font-semibold uppercase tracking-widest text-brand-accent">
          {copy.wholesaleBanner.eyebrow}
        </p>
        <h2 className="font-heading mt-4 text-[28px] font-bold text-white min-[741px]:text-[36px]">
          {copy.wholesaleBanner.title}
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
            {copy.wholesaleBanner.messageCta}
          </Link>
          <Link
            href={PHONE_TEL}
            className="inline-flex h-12 items-center justify-center rounded-[var(--radius-button)] border border-white/20 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {copy.wholesaleBanner.callPhone(PHONE_NUMBER)}
          </Link>
        </div>
      </div>
    </section>
  );
}
