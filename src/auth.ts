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
  providers: [Google],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return false;

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
