import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "./gemini";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" });
  }

  try {
    const { topic, difficulty, numQuestions, isTranslationEnabled } = await req.json();
    if (!topic || !difficulty || !numQuestions) {
      return NextResponse.json({ error: "Invalid request body!" });
    }

    // using gemini
    const questions = await generateQuestions({ topic, difficulty, numQuestions, isTranslationEnabled });

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error({ error: error?.error || error });
    return NextResponse.json({ error: "Failed to generate questions" });
  }
}
