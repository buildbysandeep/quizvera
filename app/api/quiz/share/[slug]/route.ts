import { prisma } from "@/lib/prisma";
import { slugifyQuizTitle } from "@/lib/quiz-slug";
import { evaluateQuizAvailability } from "@/lib/quiz-availability";
import { NextRequest, NextResponse } from "next/server";

const publicQuizSelect = {
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
  publishedAt: true,
  createdAt: true,
  availabilityMode: true,
  availabilityDurationMinutes: true,
  availabilityStartedAt: true,
  availabilityStartsAt: true,
  availabilityEndsAt: true,
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
} as const;

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!slug) return NextResponse.json({ ok: false, error: "Quiz not found." }, { status: 404 });

    // Old shared links used internal ObjectIds. Keep them working during migration,
    // but all generated and newly shared URLs use the stable slug.
    let quiz = await prisma.quiz.findFirst({
      where: { OR: [{ slug }, { previousSlugs: { has: slug } }] },
      select: publicQuizSelect,
    });

    if (!quiz && /^[a-f0-9]{24}$/i.test(slug)) {
      const legacy = await prisma.quiz.findUnique({ where: { id: slug }, select: { id: true, title: true, slug: true } });
      if (legacy) {
        let stableSlug = legacy.slug;
        if (!stableSlug) {
          const base = slugifyQuizTitle(legacy.title);
          stableSlug = base;
          let suffix = 2;
          while (
            await prisma.quiz.findFirst({ where: { slug: stableSlug, id: { not: legacy.id } }, select: { id: true } })
          ) {
            stableSlug = `${base.slice(0, 72 - String(suffix).length - 1)}-${suffix}`;
            suffix += 1;
          }
          await prisma.quiz.update({ where: { id: legacy.id }, data: { slug: stableSlug } });
        }
        // Legacy ObjectId links remain compatible but are redirected by the page
        // to the newly persisted stable slug; answer keys are never returned.
        quiz = await prisma.quiz.findUnique({ where: { id: legacy.id }, select: publicQuizSelect });
      }
    }

    if (!quiz)
      return NextResponse.json({ ok: false, error: "This quiz link is invalid or no longer available." }, { status: 404 });

    const serverNow = Date.now();
    const availability = evaluateQuizAvailability(quiz, serverNow);
    let published = quiz.published;
    // Timer and scheduled end times are enforced by every public request, even
    // if a cron worker has not yet persisted `published = false`.
    if (published && availability.status === "expired" && availability.expiredReason !== "unpublished") {
      await prisma.quiz.update({ where: { id: quiz.id }, data: { published: false } }).catch((cause) => {
        console.error("Could not persist expired quiz state:", cause);
      });
      published = false;
    }

    const availabilityPayload = {
      ...availability,
      serverNow: new Date(serverNow).toISOString(),
    };

    if (availability.status === "expired" && availability.expiredReason === "unpublished") {
      return NextResponse.json({ ok: false, error: "This quiz is unpublished or no longer available." }, { status: 404 });
    }

    if (availability.status === "expired" || !published) {
      return NextResponse.json(
        {
          ok: true,
          message: "This quiz is not currently accepting submissions.",
          quiz: { id: quiz.id, slug: quiz.slug, title: quiz.title, published: false, availability: availabilityPayload },
        },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }

    if (availability.status === "waiting") {
      return NextResponse.json(
        {
          ok: true,
          message: "This quiz is published and waiting to open.",
          quiz: {
            id: quiz.id,
            slug: quiz.slug,
            title: quiz.title,
            desc: quiz.desc,
            published: true,
            images: quiz.images,
            availability: availabilityPayload,
          },
        },
        { headers: { "Cache-Control": "private, no-store, max-age=0" } },
      );
    }

    // Keep the question order randomized per request without mutating any shared data.
    const questions = [...quiz.questions];
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Quiz fetched successfully",
        quiz: { ...quiz, published, questions, availability: availabilityPayload },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  } catch (cause) {
    console.error("GET /api/quiz/share/[slug] failed:", cause);
    return NextResponse.json({ ok: false, error: "Could not load this quiz." }, { status: 500 });
  }
}
