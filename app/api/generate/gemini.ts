import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateQuestions = async ({ topic, difficulty, numQuestions }: any) => {
  const prompt = `
      Generate ${numQuestions} multiple-choice quiz questions on "${topic}" with ${difficulty} difficulty.
      Each question should have 4 options (A, B, C, D) and specify the correct answer.
      
      **Respond ONLY with JSON, no extra text.**
      Ensure:
      - No trailing commas
      - No extra text before/after JSON
      - Double quotes on all keys & values
      - Properly formatted JSON array

      Example format:
      [
        {
          "id": 1,
          "title": "What is the capital of France?",
          "translatedTitle": "",
          "options": [
            {key: "a", value: "Paris", translatedValue: ""},
            {key: "b", value: "London", translatedValue: ""},
            {key: "c", value: "Berlin", translatedValue: ""},
            {key: "d", value: "Rome", translatedValue: ""}
          ],
          "answer": "c"
        }
      ]

      Ensure:
      - every question should have a unique id
      - translatedValue & translatedTitle should be an empty string.
    `;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const response = await model.generateContent(prompt);
  let generatedText = response.response.text();

  generatedText = generatedText.replace(/```json\n|```/g, "").trim();

  let questions;
  try {
    questions = JSON.parse(generatedText);
  } catch (jsonError) {
    console.warn("JSON Parsing Failed. Fixing format...");

    // Fix incorrect JSON using regex
    generatedText = generatedText
      .replace(/(\w+):/g, '"$1":') // Fix unquoted keys
      .replace(/'([^']+)'/g, '"$1"') // Convert single quotes to double quotes
      .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    questions = JSON.parse(generatedText);
  }

  return questions;
};
