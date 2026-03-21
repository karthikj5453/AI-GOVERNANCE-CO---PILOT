import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. AI features will fall back to mock data.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiModel = genAI?.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Runs a Gemini prompt and returns the result.
 * Falls back to mock function if Gemini is not configured.
 */
export async function runGeminiPrompt<T>(
  prompt: string, 
  fallbackFn: () => T,
  options: { responseMimeType?: string } = {}
): Promise<T> {
  if (!geminiModel) {
    return fallbackFn();
  }

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: options.responseMimeType ?? "application/json",
      },
    });

    const responseText = result.response.text();
    if (options.responseMimeType === "application/json") {
      return JSON.parse(responseText);
    }
    return responseText as unknown as T;
  } catch (error) {
    console.error("Gemini AI error:", error);
    return fallbackFn();
  }
}
