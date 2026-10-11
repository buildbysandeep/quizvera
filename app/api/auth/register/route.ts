import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (
      !name ||
      name.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < 8 ||
      password.length > 128
    ) {
      return NextResponse.json(
        { ok: false, error: "Enter a valid name and email, and use a password between 8 and 128 characters." },
        { status: 400 },
      );
    }

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
        isOnBoarded: true,
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, message: "Account created successfully. Please sign in." }, { status: 201 });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") {
      return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json({ ok: false, error: "Could not create your account." }, { status: 500 });
  }
}
