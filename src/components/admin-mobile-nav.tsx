"use client";

import { useState, useEffect } from "react";
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

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    function handleClick() {
      setOpen(false);
    }
    // Delay to avoid closing from the same tap that opened it
    const id = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handleClick);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-bg hover:text-text-primary md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <nav
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-14 z-50 max-h-[70vh] overflow-y-auto border-b border-border bg-surface p-2 shadow-lg md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
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
                className="flex items-center gap-2.5 rounded-md px-3 py-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          <div className="mt-1 border-t border-border pt-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-3 text-xs font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
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
