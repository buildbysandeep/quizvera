"use server";

import { getCurrentUserId } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImages } from "@/lib/cloudinary";


export const createGroupDB = async ({ name, desc = "" }: { name: string; desc?: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const cleanName = name.trim();
    const cleanDesc = desc.trim();
    if (!cleanName || cleanName.length > 80) return { ok: false, error: "Group name must be between 1 and 80 characters." };
    if (cleanDesc.length > 1000) return { ok: false, error: "Group description is too long." };
    const data = await prisma.group.create({ data: { name: cleanName, desc: cleanDesc, adminId: userId } });
    return { ok: true, data };
  } catch (cause) {
    const code = (cause as { code?: string } | null)?.code;
    if (code === "P2002") return { ok: false, error: "A group with this name already exists." };
    console.error("Create group failed:", cause);
    return { ok: false, error: "Could not create this group. Please try again." };
  }
};

export const deleteGroupDB = async ({ id }: { id: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };

    const group = await prisma.group.findFirst({
      where: { id, adminId: userId },
      select: { id: true, quizzes: { select: { images: { select: { publicId: true, url: true } } } } },
    });
    if (!group) return { ok: false, error: "Group not found or access denied." };

    const images = group.quizzes.flatMap((quiz) => quiz.images);
    const publicIds = images.map((image) => image.publicId);
    // Removing the group must not destroy cover art that was never imported
    // into the owner's personal image library (legacy quizzes).
    for (const image of images) {
      await prisma.userImage.upsert({
        where: { userId_publicId: { userId, publicId: image.publicId } },
        update: { url: image.url },
        create: { userId, publicId: image.publicId, url: image.url },
      });
    }
    const data = await prisma.group.delete({ where: { id } });
    const cleanup = await deleteCloudinaryImages(publicIds);
    if (!cleanup.ok) console.error("Group deleted, but Cloudinary cleanup failed:", cleanup.error);
    return {
      ok: true,
      data,
      warning: cleanup.ok ? undefined : "Group deleted, but one or more associated images could not be removed from storage.",
    };
  } catch (error) {
    console.error("Delete group failed:", error);
    return { ok: false, error: "Could not delete this group. Please try again." };
  }
};
