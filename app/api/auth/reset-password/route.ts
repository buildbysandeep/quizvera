import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ ok: false, error: "This reset link is invalid or has expired." }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ ok: false, error: "Password must be between 8 and 128 characters." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.resetToken || !user.resetTokenExpiry || user.resetTokenExpiry.getTime() <= Date.now()) {
      return NextResponse.json({ ok: false, error: "This reset link is invalid or has expired." }, { status: 400 });
    }
    if (!comparePassword(token, user.resetToken)) {
      return NextResponse.json({ ok: false, error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("POST /api/auth/reset-password failed:", error);
    return NextResponse.json({ ok: false, error: "Could not reset password. Please request a new link." }, { status: 500 });
  }
}
