"use server";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

/**
 * Sign in
 * POST /api/auth/register
 * body: { name, email, password }
 * action: "find user", "create user"
 */
export async function POST(req: NextRequest) {
  if (req.method === "POST") {
    try {
      const { name, email, password } = await req.json();
      if (!name && !email && !password) {
        return NextResponse.json({ ok: false, error: "Invalid request body!" }, { status: 400 });
      }

      // Find user
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        return NextResponse.json({ ok: false, error: "A user with that email already exists" }, { status: 400 });
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
          isOnBoarded: true,
        },
      });

      if (!newUser) {
        return NextResponse.json({ ok: false, error: "Something went wrong!" }, { status: 500 });
      }

      const response = NextResponse.json(
        { ok: true, message: "User created successfully! Please sign in" },
        { status: 200 }
      );
      return response;
    } catch (error: any) {
      console.error(error?.message);
      return NextResponse.json({ ok: false, error: "Something went wrong!" }, { status: 500 });
    }
  } else {
    return NextResponse.json({ ok: false, error: "Method not allowed", status: 405 });
  }
}
