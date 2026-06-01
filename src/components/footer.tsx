import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Phone, Mail } from "lucide-react";
import {
  FACEBOOK_URL,
  YOUTUBE_URL,
  MESSENGER_URL,
  PHONE_NUMBER,
  PHONE_TEL,
  EMAIL,
} from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { getLangFromRequest } from "@/lib/lang";

export async function Footer() {
  const copy = getCopy(await getLangFromRequest());
  return (
    <footer className="bg-brand-darkest pb-16 text-white lg:pb-0">
      <div className="container-site py-12">
        {/* Main grid — stacks on mobile, 4 columns on desktop */}
        <div className="grid gap-10 min-[741px]:grid-cols-[1.4fr_1fr_1fr_1fr] min-[741px]:gap-8">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/whitebglogo.png"
                alt={copy.footer.logoAlt}
                width={80}
                height={80}
                className="h-12 w-12"
              />
              <div>
                <p className="text-lg font-bold leading-tight">
                  NOEL AGRI<span className="text-brand-accent">TV</span>
                </p>
                <p className="text-xs text-white/50">{copy.footer.since}</p>
              </div>
            </Link>
            <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-white/60">
              {copy.footer.blurb}
            </p>

            {/* Social icons */}
            <div className="mt-5 flex gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label={copy.footer.facebookAriaLabel}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label={copy.footer.youtubeAriaLabel}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label={copy.footer.messengerAriaLabel}
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {copy.footer.shop}
            </p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label={copy.footer.shopLinksAriaLabel}>
              <Link href="/products" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.footer.allProducts}
              </Link>
              <Link href="/products?category=crop-care" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.footer.cropCare}
              </Link>
              <Link href="/products?category=seeds" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.footer.seeds}
              </Link>
            </nav>
          </div>

          {/* Column 3: Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {copy.footer.company}
            </p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label={copy.footer.companyLinksAriaLabel}>
              <Link href="/about" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.footer.aboutNoelAgriTv}
              </Link>
              <Link href="/contact" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.footer.contactUs}
              </Link>
              <Link href="/lookup" className="text-sm text-white/70 transition-colors hover:text-white">
                {copy.common.findMyOrder}
              </Link>
            </nav>
          </div>

          {/* Column 4: Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {copy.footer.getInTouch}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a
                href={PHONE_TEL}
                className="flex items-center gap-2 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {PHONE_NUMBER}
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {EMAIL}
              </a>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                {copy.footer.messageUsOnFacebook}
              </a>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            {copy.footer.jtExpress}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            {copy.footer.nationwideDelivery}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            {copy.footer.gcash}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            {copy.footer.maya}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            {copy.footer.cod}
          </span>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/40 min-[741px]:flex-row">
          <p>{copy.footer.copyright}</p>
          <p>
            {copy.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
