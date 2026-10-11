"use server";

import { getCurrentUserId } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { slugifyGroupName } from "@/lib/group-slug";

async function createUniqueGroupSlug(name: string): Promise<string> {
  const base = slugifyGroupName(name);
  for (let suffix = 1; suffix <= 40; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
    if (!(await prisma.group.findFirst({ where: { slug: candidate }, select: { id: true } }))) return candidate;
  }
  return `${base.slice(0, 56)}-${Date.now().toString(36)}`;
}


export const createGroupDB = async ({ name, desc = "" }: { name: string; desc?: string }) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { ok: false, error: "You must be signed in." };
    const cleanName = name.trim();
    const cleanDesc = desc.trim();
    if (!cleanName || cleanName.length > 80) return { ok: false, error: "Group name must be between 1 and 80 characters." };
    if (cleanDesc.length > 1000) return { ok: false, error: "Group description is too long." };
    const slug = await createUniqueGroupSlug(cleanName);
    const data = await prisma.group.create({ data: { slug, name: cleanName, desc: cleanDesc, adminId: userId } });
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
    // Group deletion cascades quiz records, but cover art is reusable personal
    // library content. Preserve it in the owner's library and never delete the
    // underlying Cloudinary asset as a side effect of deleting a group.
    for (const image of images) {
      await prisma.userImage.upsert({
        where: { userId_publicId: { userId, publicId: image.publicId } },
        update: { url: image.url },
        create: { userId, publicId: image.publicId, url: image.url },
      });
    }
    const data = await prisma.group.delete({ where: { id } });
    return { ok: true, data };
  } catch (error) {
    console.error("Delete group failed:", error);
    return { ok: false, error: "Could not delete this group. Please try again." };
  }
};
