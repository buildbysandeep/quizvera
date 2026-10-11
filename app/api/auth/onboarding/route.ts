import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 120) {
      return NextResponse.json({ ok: false, error: "Enter a valid name." }, { status: 400 });
    }

    // Never accept an email from the browser as the identity to update. A
    // client could otherwise mark another user's account as onboarded.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, isOnBoarded: true },
      select: { id: true, name: true, email: true, isOnBoarded: true },
    });

    return NextResponse.json({ ok: true, message: "Profile completed successfully", data: updatedUser });
  } catch (error) {
    console.error("PUT /api/auth/onboarding failed:", error);
    return NextResponse.json({ ok: false, error: "Could not complete onboarding." }, { status: 500 });
  }
}
