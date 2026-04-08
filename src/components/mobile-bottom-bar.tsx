"use client";

import Link from "next/link";
import { ShoppingBag, MessageCircle, Phone, Send } from "lucide-react";
import { MESSENGER_URL, PHONE_NUMBER, PHONE_TEL } from "@/lib/constants";
import { trackMessengerClick, trackCallClick } from "@/lib/analytics";

export function MobileBottomBar() {
  return (
    <nav
      role="navigation"
      aria-label="Quick actions"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden"
    >
      <div className="flex h-16 items-stretch">
        <Link
          href="/products"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-primary active:bg-bg"
        >
          <ShoppingBag className="h-5 w-5 shrink-0" />
          <span className="text-[11px] font-semibold">Products</span>
        </Link>
        <a
          href="https://m.me/noeltolentino2728"
          rel="noopener noreferrer"
          onClick={() => trackMessengerClick("bottom-bar")}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-primary active:bg-bg"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-[11px] font-semibold">Messenger</span>
        </a>
        <a
          href={`sms:${PHONE_NUMBER.replace(/-/g, "")}`}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-primary active:bg-bg"
        >
          <Send className="h-5 w-5 shrink-0" />
          <span className="text-[11px] font-semibold">SMS</span>
        </a>
        <a
          href={PHONE_TEL}
          onClick={() => trackCallClick("bottom-bar")}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-text-primary active:bg-bg"
        >
          <Phone className="h-5 w-5 shrink-0" />
          <span className="text-[11px] font-semibold">Call</span>
        </a>
      </div>
    </nav>
  );
}
