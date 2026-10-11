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
    if (!id) return NextResponse.json({ ok: false, error: "Folder id is required." }, { status: 400 });

    let group = await prisma.group.findFirst({
      where: { OR: [{ slug: id }, { previousSlugs: { has: id } }], adminId },
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
          id: true,
          slug: true,
          name: true,
          desc: true,
          createdAt: true,
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
      group = await prisma.group.update({
        where: { id: group.id },
        data: { slug: candidate },
        select: {
          id: true,
          slug: true,
          name: true,
          desc: true,
          createdAt: true,
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
    }
    return NextResponse.json(
      {
        ok: true,
        message: "Folder fetched successfully",
        group,
        legacyRedirectSlug: id !== group.slug ? group.slug : undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/groups/[name] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load this folder." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const adminId = (session?.user as { id?: string } | undefined)?.id;
    if (!adminId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const routeKey = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!routeKey) return NextResponse.json({ ok: false, error: "Folder slug is required." }, { status: 400 });

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!name || name.length > 100) {
      return NextResponse.json({ ok: false, error: "Folder name must be between 1 and 100 characters." }, { status: 400 });
    }
    if (description.length > 500) {
      return NextResponse.json({ ok: false, error: "Description must be 500 characters or fewer." }, { status: 400 });
    }

    let group = await prisma.group.findFirst({
      where: { adminId, OR: [{ slug: routeKey }, { previousSlugs: { has: routeKey } }] },
      select: { id: true, slug: true, previousSlugs: true, name: true, desc: true, adminId: true },
    });
    if (!group && /^[a-f0-9]{24}$/i.test(routeKey)) {
      group = await prisma.group.findFirst({
        where: { id: routeKey, adminId },
        select: { id: true, slug: true, previousSlugs: true, name: true, desc: true, adminId: true },
      });
    }
    if (!group) return NextResponse.json({ ok: false, error: "Folder not found or access denied." }, { status: 404 });

    const duplicate = await prisma.group.findFirst({
      where: { adminId, name, id: { not: group.id } },
      select: { id: true },
    });
    if (duplicate)
      return NextResponse.json({ ok: false, error: "You already have a folder with this name." }, { status: 409 });

    let slug = group.slug;
    let previousSlugs = group.previousSlugs ?? [];
    if (name !== group.name || !slug) {
      const base = slugifyGroupName(name);
      let candidate = base;
      let suffix = 2;
      while (await prisma.group.findFirst({ where: { slug: candidate, id: { not: group.id } }, select: { id: true } })) {
        candidate = `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
        suffix += 1;
      }
      slug = candidate;
      if (group.slug && group.slug !== slug) previousSlugs = Array.from(new Set([...previousSlugs, group.slug]));
    }

    const updated = await prisma.group.update({
      where: { id: group.id },
      data: { name, desc: description, slug, previousSlugs },
      select: { id: true, slug: true, name: true, desc: true, adminId: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({ ok: true, message: "Folder details updated.", data: updated }, { status: 200 });
  } catch (cause) {
    const code = (cause as { code?: string } | null)?.code;
    if (code === "P2002")
      return NextResponse.json({ ok: false, error: "A folder with this name or URL already exists." }, { status: 409 });
    console.error("PATCH /api/groups/[name] failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not update this folder." }, { status: 500 });
  }
}
