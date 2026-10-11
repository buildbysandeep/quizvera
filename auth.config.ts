import type { NextAuthConfig } from "next-auth";

/** Edge-safe configuration shared by middleware and the Node.js auth handler. */
export const authConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [],
} satisfies NextAuthConfig;
