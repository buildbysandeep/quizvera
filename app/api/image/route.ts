import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function getSessionUserId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    // Import images already attached to the user's existing quizzes so the library
    // also works for projects created before the personal library was introduced.
    const [groups, sharedQuizzes] = await Promise.all([
      prisma.group.findMany({ where: { adminId: userId }, select: { id: true } }),
      prisma.quizCollaborator.findMany({ where: { userId }, select: { quizId: true } }),
    ]);
    const groupIds = groups.map((group) => group.id);
    const sharedQuizIds = sharedQuizzes.map((quiz) => quiz.quizId);
    const accessibleQuizzes = await prisma.quiz.findMany({
      where: { OR: [
        ...(groupIds.length ? [{ groupId: { in: groupIds } }] : []),
        ...(sharedQuizIds.length ? [{ id: { in: sharedQuizIds } }] : []),
      ] },
      select: { id: true },
    });
    const quizIds = accessibleQuizzes.map((quiz) => quiz.id);
    if (quizIds.length) {
      const attachedImages = await prisma.image.findMany({ where: { quizId: { in: quizIds } }, select: { publicId: true, url: true } });
      for (const image of attachedImages) {
        if (!image.publicId || !image.url) continue;
        await prisma.userImage.upsert({
          where: { userId_publicId: { userId, publicId: image.publicId } },
          update: { url: image.url },
          create: { userId, publicId: image.publicId, url: image.url },
        });
      }
    }

    const storedLibrary = await prisma.userImage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, publicId: true, url: true, createdAt: true },
    });
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
    const library = storedLibrary;
    const profileReferences = library.length ? await prisma.user.findMany({ where: { image: { in: library.map((image) => image.url) } }, select: { image: true } }) : [];
    const profileUsageByUrl = new Map<string, number>();
    for (const reference of profileReferences) if (reference.image) profileUsageByUrl.set(reference.image, (profileUsageByUrl.get(reference.image) ?? 0) + 1);
    const publicIds = library.map((image) => image.publicId);
    const references = publicIds.length ? await prisma.image.findMany({
      where: { publicId: { in: publicIds } },
      select: { publicId: true, quiz: { select: { id: true, slug: true, title: true, group: { select: { adminId: true } }, collaborators: { where: { userId }, select: { id: true } } } } },
    }) : [];
    const visibleReferences = new Map<string, { id: string; slug: string | null; title: string }[]>();
    for (const reference of references) {
      const list = visibleReferences.get(reference.publicId) ?? [];
      // Do not disclose quiz titles to a library owner unless they have access to that quiz.
      if (reference.quiz.group.adminId === userId || reference.quiz.collaborators.length > 0) {
        if (!list.some((item) => item.id === reference.quiz.id)) list.push({ id: reference.quiz.id, slug: reference.quiz.slug, title: reference.quiz.title });
      }
      visibleReferences.set(reference.publicId, list);
    }
    const usageByPublicId = new Map<string, Set<string>>();
    for (const reference of references) {
      const quizIds = usageByPublicId.get(reference.publicId) ?? new Set<string>();
      quizIds.add(reference.quiz.id);
      usageByPublicId.set(reference.publicId, quizIds);
    }
    const data = library.map((image) => ({ ...image, usageCount: usageByPublicId.get(image.publicId)?.size ?? 0, profileUsageCount: profileUsageByUrl.get(image.url) ?? 0, usedIn: visibleReferences.get(image.publicId) ?? [] }))
      // Profile-only uploads are stored separately. Hide legacy assets still
      // referenced as a profile picture unless they are also used by a quiz.
      .filter((image) => !(image.usageCount === 0 && ((currentUser?.image && image.url === currentUser.image) || image.profileUsageCount > 0)));
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    console.error("GET /api/image failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to load your image library." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES + 256 * 1024) {
      return NextResponse.json({ ok: false, error: "Image upload payload is too large." }, { status: 413 });
    }
    if (!(await getSessionUserId())) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Image file is required." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ ok: false, error: "Image must be smaller than 5 MB." }, { status: 413 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ ok: false, error: "Image storage is not configured." }, { status: 503 });
    }

    formData.set("upload_preset", uploadPreset);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: result?.error?.message || "Image upload failed." }, { status: response.status });
    }

    const publicId = typeof result?.public_id === "string" ? result.public_id : "";
    const secureUrl = typeof result?.secure_url === "string" ? result.secure_url : "";
    if (!publicId || !secureUrl) {
      return NextResponse.json({ ok: false, error: "Image storage returned an incomplete response." }, { status: 502 });
    }

    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    await prisma.userImage.upsert({
      where: { userId_publicId: { userId, publicId } },
      update: { url: secureUrl },
      create: { userId, publicId, url: secureUrl },
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/image failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to upload image." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const publicIds = Array.from(new Set((request.nextUrl.searchParams.get("public_ids") || "")
      .split(",").map((value) => value.trim()).filter(Boolean)));
    if (!publicIds.length || publicIds.length > 20) {
      return NextResponse.json({ ok: false, error: "Provide between 1 and 20 image IDs." }, { status: 400 });
    }

    const owned = await prisma.userImage.findMany({ where: { userId, publicId: { in: publicIds } }, select: { publicId: true, url: true } });
    const ownedIds = new Set(owned.map((image) => image.publicId));
    if (publicIds.some((publicId) => !ownedIds.has(publicId))) {
      return NextResponse.json({ ok: false, error: "One or more images are not in your library." }, { status: 403 });
    }
    // Keep this response private-safe: a reused Cloudinary public ID might be
    // referenced by a quiz the current user cannot access, so never return its title.
    const quizReferences = await prisma.image.findMany({
      where: { publicId: { in: publicIds } },
      select: { publicId: true, quizId: true },
    });
    const profileReferences = await prisma.user.findMany({ where: { image: { in: owned.map((image) => image.url) } }, select: { image: true } });
    const profileUrlsInUse = new Set(profileReferences.map((user) => user.image).filter((url): url is string => Boolean(url)));
    if (quizReferences.length) {
      const quizIdsByImage = new Map<string, Set<string>>();
      for (const reference of quizReferences) {
        const quizIds = quizIdsByImage.get(reference.publicId) ?? new Set<string>();
        quizIds.add(reference.quizId);
        quizIdsByImage.set(reference.publicId, quizIds);
      }
      const blocked = publicIds.filter((publicId) => (quizIdsByImage.get(publicId)?.size ?? 0) > 0);
      if (blocked.length) {
        return NextResponse.json({
          ok: false,
          error: "Images currently used by quizzes cannot be deleted. Remove them from every quiz using them first.",
          inUse: blocked.map((publicId) => ({ publicId, count: quizIdsByImage.get(publicId)?.size ?? 0 })),
        }, { status: 409 });
      }
    }
    const profileBlocked = owned.filter((image) => profileUrlsInUse.has(image.url));
    if (profileBlocked.length) {
      return NextResponse.json({ ok: false, error: "This image is currently used as a profile picture. Change the profile picture before deleting the asset.", inUse: profileBlocked.map((image) => ({ publicId: image.publicId, profile: true })) }, { status: 409 });
    }
    await prisma.userImage.deleteMany({ where: { userId, publicId: { in: publicIds } } });
    // The Cloudinary helper skips any asset still referenced by a quiz or by
    // another user's library, so removing it here never breaks existing quizzes.
    const cleanup = await deleteCloudinaryImages(publicIds);
    if (!cleanup.ok) {
      // Preserve the library rows if storage deletion failed, so users never lose
      // their reusable asset reference due to a partial infrastructure failure.
      await Promise.all(owned.map((image) => prisma.userImage.upsert({
        where: { userId_publicId: { userId, publicId: image.publicId } },
        update: { url: image.url },
        create: { userId, publicId: image.publicId, url: image.url },
      })));
      return NextResponse.json({ ok: false, error: "The image could not be deleted from storage, so it remains in your library. Check Cloudinary configuration and try again." }, { status: 502 });
    }
    const warning = cleanup.preservedIds?.length
      ? "Removed from your library. The underlying asset was kept because another quiz or library still references it."
      : "Image deleted from your library and storage.";
    return NextResponse.json({ ok: true, warning });
  } catch (error) {
    console.error("DELETE /api/image failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to remove images." }, { status: 500 });
  }
}
