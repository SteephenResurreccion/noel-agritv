import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Noel AgriTV Admin",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: don't rely on proxy.ts (middleware) alone. The login page
  // lives inside this route group, so exempt it to avoid a redirect loop — it
  // renders its own sign-in UI and self-redirects when already authenticated.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  if (!isLoginPage) {
    const session = await auth();
    if (!session?.user?.role) {
      redirect("/admin/login");
    }
  }

  return <>{children}</>;
}
