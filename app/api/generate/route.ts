import { NextRequest, NextResponse } from "next/server";
import { generateQuestions } from "./gemini";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" });
  }

  try {
    const { topic, difficulty, numQuestions } = await req.json();

    // using gemini
    const questions = await generateQuestions({ topic, difficulty, numQuestions });

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error({ error: error?.error || error });
    return NextResponse.json({ error: "Failed to generate questions" });
  }
}
