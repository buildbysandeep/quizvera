import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateQuestions = async ({ topic, difficulty, numQuestions, isTranslationEnabled }: any) => {
  let prompt = `
      Generate ${numQuestions} multiple-choice quiz questions on "${topic}" with ${difficulty} difficulty.
      Each question should have 4 options (A, B, C, D) and specify the correct answer.
      
      **Respond ONLY with JSON, no extra text.**
      Ensure:
      - No trailing commas
      - No extra text before/after JSON
      - Double quotes on all keys & values
      - Properly formatted JSON array
      - If question contains some snippets, include them as snippet key & donot mention language in snippet but add a seperate key for language

      Example format:
      [
        {
          "id": 1,
          "title": "What is the capital of France?",
          "translatedTitle": "",
          "snippet": "",
          "snippetLang": "",
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
    `;

  if (isTranslationEnabled) {
    prompt += `
      - translatedValue & translatedTitle should be in hindi. but for fixed keyword in programming or in general usses words in programming, they should be in english
    `;
  }

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

export const translateQuestion = async ({ question, o1, o2, o3, o4 }: any) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const response = await model.generateContent(
    `Translate the following question into Hindi. But for fixed keyword in programming or in general usses words in programming, they should be in english: "${question}" and the options are "${o1}", "${o2}", "${o3}", "${o4}".
    
    return object should look like this - 
    {
      "question": "",
      "options": [
        {key: "a", value: ""},
        {key: "b", value: ""},
        {key: "c", value: ""},
        {key: "d", value: ""}
      ],
    }
    `,
  );
  let generatedText = response.response.text();

  generatedText = generatedText.replace(/```json\n|```/g, "").trim();

  let result;
  try {
    result = JSON.parse(generatedText);
  } catch (jsonError) {
    console.warn("JSON Parsing Failed. Fixing format...");

    // Fix incorrect JSON using regex
    generatedText = generatedText
      .replace(/(\w+):/g, '"$1":') // Fix unquoted keys
      .replace(/'([^']+)'/g, '"$1"') // Convert single quotes to double quotes
      .replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas

    result = JSON.parse(generatedText);
  }

  return result;
};
