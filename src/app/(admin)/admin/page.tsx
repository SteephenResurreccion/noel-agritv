import { auth, signOut } from "@/auth";
import Image from "next/image";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-bg">
      {/* Admin header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/NewLogo.png"
              alt="Noel AgriTV"
              width={80}
              height={80}
              className="h-9 w-9"
            />
            <span className="text-sm font-bold text-brand-darkest">
              NOEL AGRI<span className="text-brand-accent">TV</span>
              <span className="ml-2 rounded bg-brand-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-accent">
                Admin
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-text-secondary hover:text-text-primary"
            >
              View Store
            </Link>
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm text-text-secondary">
                {session?.user?.name}
              </span>
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-brand-darkest">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome back, {session?.user?.name?.split(" ")[0] ?? "Admin"}.
        </p>

        {/* Placeholder cards */}
        <div className="mt-8 grid gap-4 min-[741px]:grid-cols-3">
          {[
            { label: "Products", value: "—", note: "Manage catalog" },
            { label: "Orders", value: "—", note: "Coming in Phase 2" },
            { label: "Messages", value: "—", note: "Coming in Phase 2" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-surface p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-brand-darkest">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{card.note}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
