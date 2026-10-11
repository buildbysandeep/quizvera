import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImages } from "@/lib/cloudinary";
import { NextRequest, NextResponse } from "next/server";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function getUserId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

function getCloudinaryPublicId(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com" || !parsed.pathname.includes("/image/upload/")) return null;
    const path = parsed.pathname.split("/image/upload/")[1]?.replace(/^v\d+\//, "");
    if (!path) return null;
    return decodeURIComponent(path.replace(/\.[^/.]+$/, ""));
  } catch {
    return null;
  }
}

async function cleanupPreviousProfileImage({
  userId,
  oldUrl,
  oldPublicId,
  newUrl,
  newPublicId,
}: {
  userId: string;
  oldUrl: string | null;
  oldPublicId: string | null;
  newUrl: string | null;
  newPublicId: string | null;
}) {
  if (!oldUrl || (oldUrl === newUrl && (!oldPublicId || oldPublicId === newPublicId))) return;
  const libraryRecord = oldPublicId
    ? await prisma.userImage.findFirst({ where: { userId, publicId: oldPublicId }, select: { publicId: true } })
    : await prisma.userImage.findFirst({ where: { userId, url: oldUrl }, select: { publicId: true } });
  const publicId = oldPublicId || libraryRecord?.publicId || getCloudinaryPublicId(oldUrl);
  if (!publicId) return;

  const [quizReferences, otherProfileReferences] = await Promise.all([
    prisma.image.findMany({ where: { publicId }, select: { id: true }, take: 1 }),
    prisma.user.findMany({
      where: { id: { not: userId }, OR: [{ image: oldUrl }, { imagePublicId: publicId }] },
      select: { id: true },
      take: 1,
    }),
  ]);
  // Keep the file if a quiz or another person's profile still uses it.
  if (quizReferences.length || otherProfileReferences.length) return;

  await prisma.userImage.deleteMany({ where: { userId, publicId } });
  // deleteCloudinaryImages also checks all users' libraries before removing the asset.
  await deleteCloudinaryImages([publicId]);
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true } });
    if (!user) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    return NextResponse.json({ ok: true, data: { ...user, plan: "Free" } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("GET /api/profile failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not load your profile." }, { status: 500 });
  }
}

/** Upload profile pictures separately from the reusable quiz-image library. */
export async function POST(request: NextRequest) {
  let uploadedPublicId = "";
  let imageSaved = false;
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_IMAGE_BYTES + 256 * 1024) return NextResponse.json({ ok: false, error: "Profile picture upload is too large." }, { status: 413 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose a profile picture file." }, { status: 400 });
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return NextResponse.json({ ok: false, error: "Use a JPG, PNG, WebP, or GIF image." }, { status: 415 });
    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return NextResponse.json({ ok: false, error: "Profile picture must be 5 MB or smaller." }, { status: 413 });

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) return NextResponse.json({ ok: false, error: "Image storage is not configured." }, { status: 503 });

    const oldUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, image: true, imagePublicId: true } });
    if (!oldUser) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    const requestedName = formData.get("name");
    const name = typeof requestedName === "string" ? requestedName.trim() : "";
    if (name && name.length > 120) return NextResponse.json({ ok: false, error: "Name must be 120 characters or fewer." }, { status: 400 });

    formData.set("upload_preset", uploadPreset);
    formData.set("folder", `${(process.env.CLOUDINARY_FOLDER_NAME || "quizvera").replace(/\/$/, "")}/profiles/${userId}`);
    formData.delete("name");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });
    const uploadResult = await response.json().catch(() => null);
    if (!response.ok) return NextResponse.json({ ok: false, error: uploadResult?.error?.message || "Profile picture upload failed." }, { status: response.status });

    uploadedPublicId = typeof uploadResult?.public_id === "string" ? uploadResult.public_id : "";
    const secureUrl = typeof uploadResult?.secure_url === "string" ? uploadResult.secure_url : "";
    if (!uploadedPublicId || !secureUrl || !secureUrl.startsWith("https://res.cloudinary.com/")) {
      if (uploadedPublicId) await deleteCloudinaryImages([uploadedPublicId]);
      return NextResponse.json({ ok: false, error: "Image storage returned an invalid response." }, { status: 502 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { image: secureUrl, imagePublicId: uploadedPublicId, ...(name ? { name } : {}) },
      select: { id: true, name: true, email: true, image: true },
    });
    imageSaved = true;
    await cleanupPreviousProfileImage({
      userId,
      oldUrl: oldUser.image,
      oldPublicId: oldUser.imagePublicId,
      newUrl: secureUrl,
      newPublicId: uploadedPublicId,
    });
    return NextResponse.json({ ok: true, data: { ...user, plan: "Free" } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    if (uploadedPublicId && !imageSaved) await deleteCloudinaryImages([uploadedPublicId]).catch(() => undefined);
    console.error("POST /api/profile failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not update your profile picture." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const image = body?.image === null ? null : typeof body?.image === "string" ? body.image.trim() : undefined;
    if (!name || name.length > 120) return NextResponse.json({ ok: false, error: "Name must be between 1 and 120 characters." }, { status: 400 });
    if (image !== undefined && image !== null && image.length > 2048) return NextResponse.json({ ok: false, error: "Profile picture URL is invalid." }, { status: 400 });

    const current = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, image: true, imagePublicId: true } });
    if (!current) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
    if (typeof image === "string" && image !== current.image) {
      let parsed: URL;
      try { parsed = new URL(image); } catch { return NextResponse.json({ ok: false, error: "Choose a profile picture uploaded to your account." }, { status: 400 }); }
      if (parsed.hostname !== "res.cloudinary.com") return NextResponse.json({ ok: false, error: "Choose a profile picture from Quizvera storage." }, { status: 400 });
      const ownedImage = await prisma.userImage.findFirst({ where: { userId, url: image }, select: { id: true } });
      if (!ownedImage) return NextResponse.json({ ok: false, error: "Upload your profile picture using the profile page." }, { status: 403 });
    }

    const user = await prisma.user.update({ where: { id: userId }, data: { name, ...(image !== undefined ? { image, ...(image === null ? { imagePublicId: null } : {}) } : {}) }, select: { id: true, name: true, email: true, image: true } });
    if (image !== undefined && image !== current.image) {
      await cleanupPreviousProfileImage({ userId, oldUrl: current.image, oldPublicId: current.imagePublicId, newUrl: image, newPublicId: null });
    }
    return NextResponse.json({ ok: true, data: { ...user, plan: "Free" } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    console.error("PUT /api/profile failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not update your profile." }, { status: 500 });
  }
}
