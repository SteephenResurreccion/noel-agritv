"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function CartBadge() {
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => s.totalItems());
  useEffect(() => setMounted(true), []);

  return (
    <Link
      href="/cart"
      aria-label={`Cart${mounted && count > 0 ? `, ${count} items` : ""}`}
      className="relative flex h-10 w-10 items-center justify-center"
    >
      <ShoppingCart className="h-5 w-5 text-text-primary" />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
