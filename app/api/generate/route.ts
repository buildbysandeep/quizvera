import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "./gemini";
import { getAccessibleQuiz } from "@/lib/authorization";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as { id?: string } | undefined)?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const quizId = typeof body?.quizId === "string" ? body.quizId : "";
    if (!quizId || !(await getAccessibleQuiz(quizId, (session!.user as { id: string }).id))) {
      return NextResponse.json({ ok: false, error: "Quiz not found or access denied." }, { status: 403 });
    }
    const topic = typeof body?.topic === "string" ? body.topic.trim() : "";
    const difficulty = typeof body?.difficulty === "string" ? body.difficulty : "";
    const numQuestions = Number(body?.numQuestions);
    const isTranslationEnabled = body?.isTranslationEnabled === true;

    if (!topic || topic.length > 200) {
      return NextResponse.json({ ok: false, error: "Topic must be between 1 and 200 characters." }, { status: 400 });
    }
    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json({ ok: false, error: "Select a valid difficulty level." }, { status: 400 });
    }
    // if (!Number.isInteger(numQuestions) || numQuestions < 1 || numQuestions > 20) {
    //   return NextResponse.json({ ok: false, error: "Generate between 1 and 20 questions per request." }, { status: 400 });
    // }

    const questions = await generateQuestions({ topic, difficulty, numQuestions, isTranslationEnabled });
    return NextResponse.json({ ok: true, questions }, { status: 200 });
  } catch (error) {
    console.error("POST /api/generate failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to generate questions. Please try again." }, { status: 500 });
  }
}
