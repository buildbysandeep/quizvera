import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split("/").filter(Boolean).pop();
    if (!id) return NextResponse.json({ ok: false, error: "Quiz not found." }, { status: 404 });

    const quiz = await prisma.quiz.findFirst({
      where: { id, published: true },
      select: {
        id: true,
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

    if (!quiz) return NextResponse.json({ ok: false, error: "This quiz link is invalid or no longer available." }, { status: 404 });

    // Keep the question order randomized per request without mutating any shared data.
    const questions = [...quiz.questions];
    for (let index = questions.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [questions[index], questions[randomIndex]] = [questions[randomIndex], questions[index]];
    }

    return NextResponse.json({ ok: true, message: "Quiz fetched successfully", quiz: { ...quiz, questions } });
  } catch (error) {
    console.error("GET /api/quiz/share/[id] failed:", error);
    return NextResponse.json({ ok: false, error: "Could not load this quiz." }, { status: 500 });
  }
}
