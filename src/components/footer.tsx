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

export function Footer() {
  return (
    <footer className="bg-brand-darkest text-white">
      <div className="container-site py-12">
        {/* Main grid — stacks on mobile, 4 columns on desktop */}
        <div className="grid gap-10 min-[741px]:grid-cols-[1.4fr_1fr_1fr_1fr] min-[741px]:gap-8">
          {/* Column 1: Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/images/NewLogo.png"
                alt="Noel AgriTV"
                width={80}
                height={80}
                className="h-12 w-12"
              />
              <div>
                <p className="text-lg font-bold leading-tight">
                  NOEL AGRI<span className="text-brand-accent">TV</span>
                </p>
                <p className="text-xs text-white/50">Since 2021</p>
              </div>
            </Link>
            <p className="mt-4 max-w-[260px] text-sm leading-relaxed text-white/60">
              Natural, bio-organic crop care products trusted by Filipino
              farmers nationwide.
            </p>

            {/* Social icons */}
            <div className="mt-5 flex gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label="Facebook"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label="YouTube"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-brand-accent hover:text-white"
                aria-label="Messenger"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Shop
            </p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Footer shop links">
              <Link href="/products" className="text-sm text-white/70 transition-colors hover:text-white">
                All Products
              </Link>
              <Link href="/products?category=bio-organic-solutions" className="text-sm text-white/70 transition-colors hover:text-white">
                Bio-Organic Solutions
              </Link>
              <Link href="/products?category=seeds" className="text-sm text-white/70 transition-colors hover:text-white">
                Seeds
              </Link>
              <Link href="/products?category=garden-tools" className="text-sm text-white/70 transition-colors hover:text-white">
                Garden Tools
              </Link>
            </nav>
          </div>

          {/* Column 3: Company */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Company
            </p>
            <nav className="mt-4 flex flex-col gap-2.5" aria-label="Footer company links">
              <Link href="/about" className="text-sm text-white/70 transition-colors hover:text-white">
                About Noel AgriTV
              </Link>
              <Link href="/contact" className="text-sm text-white/70 transition-colors hover:text-white">
                Contact Us
              </Link>
            </nav>
          </div>

          {/* Column 4: Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Get in Touch
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a
                href={PHONE_TEL}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {PHONE_NUMBER}
              </a>
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {EMAIL}
              </a>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                Message us on Facebook
              </a>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            J&amp;T Express
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            Nationwide Delivery
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            GCash
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            Maya
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
            COD
          </span>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/40 min-[741px]:flex-row">
          <p>&copy; 2026 Noel AgriTV. All rights reserved.</p>
          <p>
            Natural farming solutions for the Philippines
          </p>
        </div>
      </div>
    </footer>
  );
}
