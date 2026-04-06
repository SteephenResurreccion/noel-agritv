"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  Video,
  ExternalLink,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/videos", label: "Videos", icon: Video },
];

const OWNER_NAV_ITEMS = [
  { href: "/admin/team", label: "Team", icon: Users },
];

export function AdminMobileNav({ role }: { role?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <nav className="absolute left-0 right-0 top-14 z-50 border-b border-border bg-surface p-2 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {role === "owner" &&
            OWNER_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          <div className="mt-1 border-t border-border pt-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Store
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
