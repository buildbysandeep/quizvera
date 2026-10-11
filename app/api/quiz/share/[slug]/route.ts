import { prisma } from "@/lib/prisma";
import { slugifyQuizTitle } from "@/lib/quiz-slug";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!slug) return NextResponse.json({ ok: false, error: "Quiz not found." }, { status: 404 });

    let quiz = await prisma.quiz.findFirst({
      where: { slug, published: true },
      select: {
        id: true,
        slug: true,
        title: true,
        desc: true,
        duration: true,
        maxMarks: true,
        userInputs: true,
        isStrictMode: true,
        translationEnabled: true,
        sourceLanguage: true,
        targetLanguage: true,
        groupId: true,
        published: true,
        footerHeading1: true,
        footerHeading2: true,
        footerText1: true,
        footerText2: true,
        footerLink: true,
        questions: {
          select: {
            id: true,
            title: true,
            translatedTitle: true,
            showSnippet: true,
            snippet: true,
            snippetLang: true,
            options: { select: { id: true, key: true, value: true, translatedValue: true } },
          },
        },
        images: { select: { id: true, key: true, url: true } },
      },
    });

    // Old shared links used internal ObjectIds. Keep them working during migration,
    // but all generated and newly shared URLs use the stable slug.
    if (!quiz && /^[a-f0-9]{24}$/i.test(slug)) {
      const legacy = await prisma.quiz.findFirst({ where: { id: slug, published: true }, select: { id: true, title: true, slug: true } });
      if (legacy) {
        let stableSlug = legacy.slug;
        if (!stableSlug) {
          const base = slugifyQuizTitle(legacy.title);
          stableSlug = base;
          let suffix = 2;
          while (await prisma.quiz.findFirst({ where: { slug: stableSlug, id: { not: legacy.id } }, select: { id: true } })) {
            stableSlug = `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
            suffix += 1;
          }
          await prisma.quiz.update({ where: { id: legacy.id }, data: { slug: stableSlug } });
        }
        // Legacy ObjectId links remain compatible but are redirected by the page
        // to the newly persisted stable slug; answer keys are never returned.
        quiz = await prisma.quiz.findFirst({
          where: { slug: stableSlug, published: true },
          select: {
            id: true, slug: true, title: true, desc: true, duration: true, maxMarks: true, userInputs: true,
            isStrictMode: true, translationEnabled: true, sourceLanguage: true, targetLanguage: true, groupId: true, published: true,
            footerHeading1: true, footerHeading2: true, footerText1: true, footerText2: true, footerLink: true,
            questions: { select: { id: true, title: true, translatedTitle: true, showSnippet: true, snippet: true, snippetLang: true, options: { select: { id: true, key: true, value: true, translatedValue: true } } } },
            images: { select: { id: true, key: true, url: true } },
          },
        });
      }
    }

    if (!quiz) return NextResponse.json({ ok: false, error: "This quiz link is invalid or no longer available." }, { status: 404 });

    // Keep the question order randomized per request without mutating any shared data.
    const questions = [...quiz.questions];
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }

    return NextResponse.json({ ok: true, message: "Quiz fetched successfully", quiz: { ...quiz, questions } });
  } catch (error) {
    console.error("GET /api/quiz/share/[slug] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load this quiz." }, { status: 500 });
  }
}
