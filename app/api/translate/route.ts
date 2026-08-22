import { NextRequest } from "next/server";
import { translateQuestion } from "../generate/gemini";

export async function POST(req: NextRequest) {
  try {
    const { question, o1, o2, o3, o4 } = await req.json();
    if (!question || !o1 || !o2 || !o3 || !o4) {
      return new Response(JSON.stringify({ error: "Invalid request body!" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await translateQuestion({ question, o1, o2, o3, o4 });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error translating:", error);
    return new Response(JSON.stringify({ error: "Failed to translate" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
