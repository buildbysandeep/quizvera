import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { authConfig } from "./auth.config";
import { handleCredentialsSignIn, handleFindUser, handleGoogleSignIn } from "./lib/auth.helpers";

export const authOptions: NextAuthConfig = {
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === "string" ? credentials.email : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;
        try {
          return await handleCredentialsSignIn({ email, password });
        } catch (cause) {
          console.error("Credentials sign-in failed:", cause);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") return handleGoogleSignIn({ profile });
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await handleFindUser({ email: token.email });
        if (dbUser) {
          token.id = dbUser.id;
          token.isOnBoarded = dbUser.isOnBoarded;
          token.role = dbUser.role;
        }
      }
      if (user && account?.provider === "credentials") {
        const currentUser = user as typeof user & { isOnBoarded?: boolean; role?: string[] };
        token.id = currentUser.id;
        token.isOnBoarded = Boolean(currentUser.isOnBoarded);
        token.role = currentUser.role ?? [];
      }
      return token as JWT;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: typeof token.id === "string" ? token.id : "",
          isOnBoarded: Boolean(token.isOnBoarded),
          role: Array.isArray(token.role) ? token.role : [],
        },
      } as Session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
