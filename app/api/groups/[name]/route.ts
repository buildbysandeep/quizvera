import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { slugifyGroupName } from "@/lib/group-slug";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = (session?.user as { id?: string } | undefined)?.id;
    if (!adminId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const id = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!id) return NextResponse.json({ ok: false, error: "Group id is required." }, { status: 400 });

    let group = await prisma.group.findFirst({
      where: { slug: id, adminId },
      select: {
        id: true,
        slug: true,
        name: true,
        desc: true,
        createdAt: true,
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

    // Backward-compatible legacy path support and lazy slug assignment.
    if (!group && /^[a-f0-9]{24}$/i.test(id)) {
      group = await prisma.group.findFirst({
        where: { id, adminId },
        select: {
          id: true, slug: true, name: true, desc: true, createdAt: true,
          admin: { select: { name: true } },
          quizzes: { orderBy: { createdAt: "desc" }, select: { id: true, slug: true, title: true, desc: true, published: true, createdAt: true, duration: true, maxMarks: true, _count: { select: { questions: true, participants: true } } } },
        },
      });
    }
    if (!group) return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
    if (!group.slug) {
      const base = slugifyGroupName(group.name);
      let candidate = base;
      let suffix = 2;
      while (await prisma.group.findFirst({ where: { slug: candidate, id: { not: group.id } }, select: { id: true } })) {
        candidate = `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
        suffix += 1;
      }
      group = await prisma.group.update({ where: { id: group.id }, data: { slug: candidate }, select: {
        id: true, slug: true, name: true, desc: true, createdAt: true,
        admin: { select: { name: true } },
        quizzes: { orderBy: { createdAt: "desc" }, select: { id: true, slug: true, title: true, desc: true, published: true, createdAt: true, duration: true, maxMarks: true, _count: { select: { questions: true, participants: true } } } },
      }});
    }
    return NextResponse.json({ ok: true, message: "Group fetched successfully", group, legacyRedirectSlug: id !== group.slug ? group.slug : undefined }, { status: 200 });
  } catch (error) {
    console.error("GET /api/groups/[name] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load this group." }, { status: 500 });
  }
}
