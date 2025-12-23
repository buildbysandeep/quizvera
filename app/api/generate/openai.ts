// import { OpenAI } from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export const generateQuestions = async () => {
// Generate questions using OpenAI
// const response = await openai.chat.completions.create({
//   model: "gpt-3.5-turbo",
//   messages: [
//     { role: "system", content: "You are a quiz question generator." },
//     { role: "user", content: prompt },
//   ],
//   max_tokens: 500,
// });
// console.log({ response });
// // Extract and send response
// const generatedText = response.choices[0].message.content;
// };
