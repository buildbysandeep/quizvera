import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function getSessionUserId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
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

    const publicIds = (request.nextUrl.searchParams.get("public_ids") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!publicIds.length || publicIds.length > 20) {
      return NextResponse.json({ ok: false, error: "Provide between 1 and 20 image IDs." }, { status: 400 });
    }

    const ownedGroups = await prisma.group.findMany({ where: { adminId: userId }, select: { id: true } });
    const groupIds = ownedGroups.map((group) => group.id);
    if (!groupIds.length) return NextResponse.json({ ok: false, error: "No owned image resources found." }, { status: 403 });

    const requestedImages = await prisma.image.findMany({
      where: { publicId: { in: publicIds } },
      select: { publicId: true, quizId: true },
    });
    const quizIds = Array.from(new Set(requestedImages.map((image) => image.quizId)));
    const ownedQuizzes = quizIds.length
      ? await prisma.quiz.findMany({ where: { id: { in: quizIds }, groupId: { in: groupIds } }, select: { id: true } })
      : [];
    const ownedQuizIds = new Set(ownedQuizzes.map((quiz) => quiz.id));
    const ownedPublicIds = new Set(requestedImages.filter((image) => ownedQuizIds.has(image.quizId)).map((image) => image.publicId));

    // Do not provide a Cloudinary deletion proxy for public IDs not associated
    // with the authenticated user's quizzes.
    if (publicIds.some((publicId) => !ownedPublicIds.has(publicId))) {
      return NextResponse.json({ ok: false, error: "One or more images were not found or are not yours." }, { status: 403 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ ok: false, error: "Image storage is not configured for deletion." }, { status: 503 });
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
    const authorization = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const response = await fetch(`${url}?${publicIds.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join("&")}`, {
      method: "DELETE",
      headers: { Authorization: `Basic ${authorization}` },
    });
    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: result?.error?.message || "Could not delete image files." }, { status: response.status });
    }

    return NextResponse.json({ ok: true, message: "Images deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/image failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to delete image files." }, { status: 500 });
  }
}
