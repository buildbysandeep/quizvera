"use server";

import { getCurrentUserId } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImages } from "@/lib/cloudinary";

export const deleteGroupDB = async ({ id }: { id: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };

    const group = await prisma.group.findFirst({
      where: { id, adminId: userId },
      select: { id: true, quizzes: { select: { images: { select: { publicId: true } } } } },
    });
    if (!group) return { ok: false, error: "Group not found or access denied." };

    const publicIds = group.quizzes.flatMap((quiz) => quiz.images.map((image) => image.publicId));
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
