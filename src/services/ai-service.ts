// services/ai-service.ts
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai"; // ✅ Use createOpenAI instead
import { generateText } from "ai";

// 1. Setup Gemini Provider
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// 2. Setup Groq Provider (using the OpenAI bridge)
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});


const CURRENT_GEMINI_MODEL = "gemini-3-flash-preview"; 
const CURRENT_GROQ_MODEL = "llama-3.3-70b-versatile";

export async function generateLessonNote(prompt: string) {
  try {
    // Primary: Gemini
    console.log("Attempting generation with Gemini...");
    const { text } = await generateText({
      model: google(CURRENT_GEMINI_MODEL),
      prompt,
    });
    return { text, provider: "gemini" };
  } catch (error: any) {
    // Check for Rate Limit (429) or Quota issues
    const isQuotaError = error?.status === 429 || error?.message?.toLowerCase().includes("quota");

    if (isQuotaError) {
      console.warn("Gemini limit reached. Failing over to Groq...");
      try {
        // Failover: Groq (using Llama 3.3 70B)
        const { text } = await generateText({
          model: groq(CURRENT_GROQ_MODEL), // This should now work without TS errors
          prompt,
        });
        return { text, provider: "groq" };
      } catch (groqError) {
        console.error("Groq also failed:", groqError);
        throw new Error("Both Gemini and Groq are currently unavailable.");
      }
    }
    
    // If it's not a quota error, throw it so the API can handle it
    throw error;
  }
}