import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
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
    <footer className="bg-brand-black text-white">
      <div className="container-site py-12">
        <div className="mb-6">
          <p className="text-xl font-bold">
            NOEL AGRI<span className="text-brand-accent">TV</span>
          </p>
          <p className="mt-1 text-sm text-white/60">Since 2021</p>
        </div>

        <nav className="mb-6 flex gap-6" aria-label="Footer navigation">
          <Link href="/products" className="text-sm text-white/80 hover:text-brand-accent">Products</Link>
          <Link href="/about" className="text-sm text-white/80 hover:text-brand-accent">About</Link>
          <Link href="/contact" className="text-sm text-white/80 hover:text-brand-accent">Contact</Link>
        </nav>

        <div className="mb-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">J&amp;T Express</span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Nationwide Delivery</span>
        </div>

        <div className="mb-6 flex gap-4">
          {/* Facebook brand icon */}
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:text-brand-mid" aria-label="Facebook">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>
          {/* YouTube brand icon */}
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:text-brand-mid" aria-label="YouTube">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
          <a href={MESSENGER_URL} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:text-brand-mid" aria-label="Messenger"><MessageCircle className="h-5 w-5" /></a>
        </div>

        <div className="mb-6 space-y-1">
          <a href={PHONE_TEL} className="flex items-center gap-2 text-sm text-white/80 hover:text-brand-accent">
            <Phone className="h-4 w-4" />{PHONE_NUMBER}
          </a>
          <a href={`mailto:${EMAIL}`} className="text-sm text-white/80 hover:text-brand-accent">{EMAIL}</a>
        </div>

        <div className="border-t border-white/10 pt-4 text-xs text-white/40">
          <p>&copy; 2026 Noel AgriTV. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
