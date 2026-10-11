import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = (session?.user as { id?: string } | undefined)?.id;
    if (!adminId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const id = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!id) return NextResponse.json({ ok: false, error: "Group id is required." }, { status: 400 });

    const group = await prisma.group.findFirst({
      where: { id, adminId },
      select: {
        id: true,
        name: true,
        desc: true,
        // createdAt: true,
        admin: { select: { name: true } },
        quizzes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            desc: true,
            published: true,
            createdAt: true,
            duration: true,
            maxMarks: true,
            _count: { select: { questions: true, participants: true } },
          },
        },
      },
    });

    if (!group) return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
    return NextResponse.json({ ok: true, message: "Group fetched successfully", group }, { status: 200 });
  } catch (error) {
    console.error("GET /api/groups/[name] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load this group." }, { status: 500 });
  }
}
