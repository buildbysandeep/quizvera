import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { adminId },
      select: {
        id: true,
        name: true,

        quizzes: {
          select: {
            id: true,
            slug: true,
            title: true,
            desc: true,
            published: true,
            createdAt: true,

            _count: {
              select: {
                questions: true,
                participants: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ ok: true, message: "Groups fetched successfully", data: groups }, { status: 200 });
  } catch (error: any) {
    console.error(error?.message);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const adminId = session?.user?.id;
    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!name || name.length > 100) {
      return NextResponse.json({ ok: false, error: "Group name must be between 1 and 100 characters." }, { status: 400 });
    }
    if (description.length > 500) {
      return NextResponse.json({ ok: false, error: "Group description must be 500 characters or fewer." }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: { name, desc: description, adminId },
    });

    return NextResponse.json({ ok: true, message: "Group created successfully", data: group }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Group name already exists" }, { status: 400 });
    }

    console.error(error?.message);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
