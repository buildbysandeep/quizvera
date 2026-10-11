import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import { authConfig } from "./auth.config";
import { handleCredentialsSignIn, handleFindUser, handleFindUserById, handleGoogleSignIn } from "./lib/auth.helpers";

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
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google" && token.email) {
        const dbUser = await handleFindUser({ email: token.email });
        if (dbUser) {
          token.id = dbUser.id;
          token.isOnBoarded = dbUser.isOnBoarded;
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.picture = dbUser.image ?? undefined;
        }
      }
      if (user && account?.provider === "credentials") {
        const currentUser = user as typeof user & { isOnBoarded?: boolean; role?: string[]; image?: string | null };
        token.id = currentUser.id;
        token.isOnBoarded = Boolean(currentUser.isOnBoarded);
        token.role = currentUser.role ?? [];
        token.name = currentUser.name;
        token.picture = currentUser.image ?? undefined;
      }
      if (trigger === "update" && typeof token.id === "string") {
        const currentUser = await handleFindUserById({ id: token.id });
        if (currentUser) {
          token.name = currentUser.name;
          token.picture = currentUser.image ?? undefined;
          token.email = currentUser.email;
          token.role = currentUser.role;
          token.isOnBoarded = currentUser.isOnBoarded;
        }
      }
      return token as JWT;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: typeof token.id === "string" ? token.id : "",
          name: typeof token.name === "string" ? token.name : session.user?.name,
          image: typeof token.picture === "string" ? token.picture : null,
          isOnBoarded: Boolean(token.isOnBoarded),
          role: Array.isArray(token.role) ? token.role : [],
        },
      } as Session;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
