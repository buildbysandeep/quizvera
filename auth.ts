import NextAuth, { NextAuthConfig, Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { AdapterSession, AdapterUser } from "next-auth/adapters";
import { handleCredentialsSignIn, handleGoogleSignIn } from "./lib/auth.helpers";

export const authOptions: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = credentials as {
            email: string;
            password: string;
          };

          return await handleCredentialsSignIn({ email, password });
        } catch (error) {
          console.log("error in authorize");
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  cookies: {
    sessionToken: {
      name: `__Secure-authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return await handleGoogleSignIn({ profile });
      }
      return true;
    },
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          isOnBoarded: token.isOnBoarded,
        },
      } as {
        user: IUser;
      } & AdapterSession &
        Session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        let u = user as IUser;
        return { ...token, id: u.id, isOnBoarded: u.isOnBoarded };
      }
      return token;
    },
  },
};

interface IUser extends AdapterUser {
  id: string;
  isOnBoarded: boolean;
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
