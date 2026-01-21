import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractTextFromSOW } from "@/services/sow/extractTex";
import { cleanOcrWithAI, validateIsScheme } from "@/services/sow/aiCleaner"; // Import your new AI service

export async function processSchemeOfWork(userId: string, sowFileKey: string) {
  try {
    // 1. Mark as processing
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "processing",
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    // 2. Extract raw text from OCR
    const { rawText } = await extractTextFromSOW(sowFileKey);

    if (!rawText || rawText.length < 100) {
      throw new Error("Extracted text is too short or empty");
    }

    // 1. Validate the document type
const validation = await validateIsScheme(rawText);

if (!validation.isValid) {
  console.log("--- VALIDATION FAILED: ", validation.reason); // For your server logs
  await db.update(onboarding)
    .set({
      sowProcessingStatus: "failed",
      sowErrorMessage: validation.reason || "This image doesn't appear to be a Scheme of Work.",
      updatedAt: new Date(), // Important for frontend re-fetching
    })
    .where(eq(onboarding.userId, userId));
  return; 
}

    // 3. AI CLEANUP STEP (The "Middleman")
    // We send the messy rawText to Groq and get back a structured array
    const parsedScheme = await cleanOcrWithAI(rawText);

    // Check the console to see the difference!
    console.log("--- DEBUG: AI CLEANED & PARSED SCHEME ---");
    console.dir(parsedScheme, { depth: null });

    if (!parsedScheme || parsedScheme.length === 0) {
      throw new Error("AI failed to find any scheme weeks in the text");
    }

    // 4. Save the results and mark as complete
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "complete",
        sowExtractedText: JSON.stringify(parsedScheme), // Store the clean JSON instead of raw mess
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    console.log("--- PROCESS SUCCESSFUL ---");

  } catch (error) {
    console.error("[SOW PROCESS ERROR]", error);

    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "failed",
        sowErrorMessage: error instanceof Error ? error.message : "Failed to extract scheme content",
      })
      .where(eq(onboarding.userId, userId));
  }
}