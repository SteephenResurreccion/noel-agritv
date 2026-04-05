import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ profile }) {
      // Only allow whitelisted admin emails
      const allowed = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (allowed.length === 0) return false;
      return allowed.includes(profile?.email?.toLowerCase() ?? "");
    },
    async session({ session }) {
      return session;
    },
  },
});
