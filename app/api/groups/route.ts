import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: {
        adminId: session?.user?.id,
      },
      select: {
        id: true,
        name: true,

        quizzes: {
          select: {
            id: true,
            title: true,
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
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description } = body;

    const group = await prisma.group.create({
      data: {
        name,
        desc: description,
        adminId: session?.user?.id!,
      },
    });

    return NextResponse.json({ ok: true, message: "Group created successfully", data: group }, { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Group name already exists" }, { status: 400 });
    }

    console.error(error?.message);
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
