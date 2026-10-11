import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(title) {
  const slug = String(title || "quiz")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  const safeSlug = slug || "quiz";
  const reserved = new Set(["create", "edit", "disqualified", "expired", "sb", "limit-exceed"]);
  return reserved.has(safeSlug) ? `quiz-${safeSlug}` : safeSlug;
}

async function main() {
  const quizzes = await prisma.quiz.findMany({ select: { id: true, title: true, slug: true }, orderBy: { createdAt: "asc" } });
  let updated = 0;

  for (const quiz of quizzes) {
    if (quiz.slug && quiz.slug.trim()) continue;
    const base = slugify(quiz.title);
    let candidate = base;
    let suffix = 2;
    while (await prisma.quiz.findFirst({ where: { slug: candidate, id: { not: quiz.id } }, select: { id: true } })) {
      const suffixText = `-${suffix}`;
      candidate = `${base.slice(0, 72 - suffixText.length)}${suffixText}`;
      suffix += 1;
    }
    await prisma.quiz.update({ where: { id: quiz.id }, data: { slug: candidate } });
    updated += 1;
    console.log(`Backfilled ${quiz.id} -> ${candidate}`);
  }

  console.log(`Quiz slug backfill complete. Updated ${updated} of ${quizzes.length} quizzes.`);
}

main()
  .catch((error) => {
    console.error("Quiz slug backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
