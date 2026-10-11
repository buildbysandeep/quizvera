import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { translateQuestion } from "../generate/gemini";
import { getAccessibleQuiz } from "@/lib/authorization";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as { id?: string } | undefined)?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const quizId = typeof body?.quizId === "string" ? body.quizId : "";
    const adminId = (session!.user as { id: string }).id;
    if (!quizId || !(await getAccessibleQuiz(quizId, adminId))) {
      return NextResponse.json({ ok: false, error: "Quiz not found or access denied." }, { status: 403 });
    }
    const fields = [body?.question, body?.o1, body?.o2, body?.o3, body?.o4];
    if (fields.some((value) => typeof value !== "string" || !value.trim() || value.length > 4000)) {
      return NextResponse.json({ ok: false, error: "Provide a question and four valid options." }, { status: 400 });
    }

    const data = await translateQuestion({
      question: body.question.trim(),
      o1: body.o1.trim(),
      o2: body.o2.trim(),
      o3: body.o3.trim(),
      o4: body.o4.trim(),
    });
    if (!data?.question || !Array.isArray(data.options)) {
      return NextResponse.json({ ok: false, error: "Translation service returned an invalid response." }, { status: 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("POST /api/translate failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to translate question." }, { status: 500 });
  }
}
