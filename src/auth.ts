import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { resolveRole } from "@/lib/admin-store";
import type { AdminRole } from "@/lib/admin-store";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: AdminRole;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Explicit secret + trustHost. No module-load throw on a missing secret —
  // provisioning is in flight and a hard throw would take down the storefront.
  // Auth.js fails closed (no valid session) when AUTH_SECRET is absent, and the
  // (admin) layout guard denies access on a missing role.
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [Google],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return false;
      // Require a Google-verified email before authorizing.
      if (profile?.email_verified !== true) return false;

      const role = await resolveRole(email);
      return role !== null;
    },
    async session({ session }) {
      if (session.user?.email) {
        const role = await resolveRole(session.user.email);
        session.user.role = role ?? undefined;
      }
      return session;
    },
  },
});
