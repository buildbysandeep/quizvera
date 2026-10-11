import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isOnBoarded: boolean;
      role: Role[];
    } & DefaultSession["user"];
  }

  interface User {
    isOnBoarded?: boolean;
    role?: Role[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isOnBoarded?: boolean;
    role?: Role[];
  }
}
