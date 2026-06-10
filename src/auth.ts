import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { resolveRole } from "@/lib/admin-store";
import type { AdminRole } from "@/lib/admin-store";
import { resolveRoleWithRetry } from "@/lib/auth-role";

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

// Augment the canonical @auth/core JWT interface (next-auth/jwt only re-exports
// it). next-auth/jwt isn't resolvable for augmentation under "bundler" module
// resolution since it's never imported, whereas @auth/core/jwt is already in
// the program via the jwt-callback token type.
declare module "@auth/core/jwt" {
  interface JWT {
    /**
     * The admin role, resolved in the `jwt` callback and only ever set from a
     * successful Blob read (or carried over from a prior successful read during
     * a transient outage). Never invented on failure.
     */
    role?: AdminRole;
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
    async jwt({ token }) {
      // Resolve the admin role on every JWT pass (sign-in AND every subsequent
      // session read, per Auth.js) so de-authorization takes effect promptly.
      // `resolveRoleWithRetry` retries once on a transient Blob outage and, only
      // if both attempts fail, preserves the role this same token already
      // carries from an earlier SUCCESSFUL read — so an admin doesn't silently
      // lose their role during a momentary blip. On a successful read it always
      // reflects the live result (clearing the role when the read returns null).
      if (token.email) {
        token.role = await resolveRoleWithRetry(token.email, token.role);
      }
      return token;
    },
    async session({ session, token }) {
      // Surface the token's role to the client session. The role lives on the
      // token (set in the `jwt` callback); the (admin) layout guard redirects to
      // login when it is undefined, so a Blob outage never grants access.
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    },
  },
});
