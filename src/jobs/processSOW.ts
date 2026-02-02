import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractTextFromSOW } from "@/services/sow/extractTex";
import {
  cleanOcrWithAI,
  validateIsScheme,
} from "@/services/sow/aiCleaner";

export async function processSchemeOfWork(
  userId: string,
  sowFileKey: string
) {
  try {
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "processing",
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    // 1️⃣ OCR - Get raw messy text from image
    const { rawText } = await extractTextFromSOW(sowFileKey);

    if (!rawText || rawText.trim().length < 10) {
      throw new Error("OCR failed to extract readable text.");
    }

    // 2️⃣ VALIDATE - Check if it's actually a scheme
    const validation = await validateIsScheme(rawText);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }

    // 3️⃣ AI CLEAN & STRUCTURE (Combined Step)
    // This now returns a WeekEntry[] directly (13 weeks)
    const normalizedWeeks = await cleanOcrWithAI(rawText);

    if (!normalizedWeeks || normalizedWeeks.length === 0) {
       throw new Error("AI failed to structure the document.");
    }

    // 4️⃣ SAVE
    // We skip manual extraction because normalizedWeeks is already perfect.
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "complete",
        sowExtractedText: JSON.stringify(normalizedWeeks),
        sowEdited: true,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    console.log("✅ SOW PROCESS COMPLETE");
  } catch (error: any) {
    console.error("[SOW PROCESS ERROR]", error);

    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "failed",
        sowErrorMessage: error.message || "Scheme processing failed",
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));
  }
}