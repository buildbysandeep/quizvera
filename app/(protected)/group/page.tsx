import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { slugifyGroupName } from "@/lib/group-slug";

export default async function LegacyGroupRoute({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams?.id;
  if (!id) redirect("/");
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) redirect("/");
  const group = await prisma.group.findFirst({ where: { id, adminId: userId }, select: { id: true, slug: true, name: true } });
  if (!group) redirect("/");
  let slug = group.slug;
  if (!slug) {
    const base = slugifyGroupName(group.name);
    slug = base;
    let suffix = 2;
    while (await prisma.group.findFirst({ where: { slug, id: { not: group.id } }, select: { id: true } })) {
      slug = `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
      suffix += 1;
    }
    await prisma.group.update({ where: { id: group.id }, data: { slug } });
  }
  redirect(`/group/${slug}`);
}
