import { auth, signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Video,
  ExternalLink,
  Users,
} from "lucide-react";
import { AdminMobileNav } from "./admin-mobile-nav";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/videos", label: "Videos", icon: Video },
];

const OWNER_NAV_ITEMS = [
  { href: "/admin/team", label: "Team", icon: Users },
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-[220px] shrink-0 border-r border-border bg-surface md:block">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Image
            src="/images/NewLogo.png"
            alt="Noel AgriTV"
            width={80}
            height={80}
            className="h-8 w-8"
          />
          <span className="text-sm font-bold text-brand-darkest">
            AGRI<span className="text-brand-accent">TV</span>
            <span className="ml-1.5 rounded bg-brand-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-accent">
              Admin
            </span>
          </span>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {session?.user?.role === "owner" &&
            OWNER_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="mt-auto border-t border-border px-2 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="relative flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:justify-end">
          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <AdminMobileNav role={session?.user?.role} />
            <Image
              src="/images/NewLogo.png"
              alt="Noel AgriTV"
              width={80}
              height={80}
              className="h-8 w-8"
            />
            <span className="text-sm font-bold text-brand-darkest">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt=""
                width={32}
                height={32}
                className="h-7 w-7 rounded-full"
              />
            )}
            <span className="text-sm text-text-secondary">
              {session?.user?.name}
            </span>
            {session?.user?.role && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  session.user.role === "owner"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-brand-accent/10 text-brand-accent"
                }`}
              >
                {session.user.role === "owner" ? "Owner" : "Manager"}
              </span>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
