// jobs/processSOW.ts (or wherever your processing logic lives)

import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cleanOcrWithAI, validateIsScheme } from "@/services/sow/aiCleaner";

/**
 * 🚀 High-Speed AI Processing
 * Bypasses OCR timeouts by using text already extracted in the browser.
 */
export async function processSchemeOfWork(
  userId: string,
  rawText: string 
) {
  try {
    console.log(`[PROCESS] Starting AI analysis for User: ${userId}`);

    // 1️⃣ VALIDATE - Is this actually a Scheme of Work?
    // This prevents users from uploading random receipts or text.
    const validation = await validateIsScheme(rawText);
    
    if (!validation.isValid) {
      throw new Error(validation.reason || "This document doesn't look like a valid Scheme of Work.");
    }

    // 2️⃣ AI CLEAN & STRUCTURE
    // Transforms messy "OCR-ish" text into a clean WeekEntry[] array.
    const normalizedWeeks = await cleanOcrWithAI(rawText);

    if (!normalizedWeeks || !Array.isArray(normalizedWeeks) || normalizedWeeks.length === 0) {
       throw new Error("AI was unable to identify weeks or topics in this document.");
    }

    // 3️⃣ FINAL SAVE
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "complete",
        sowExtractedText: JSON.stringify(normalizedWeeks), // Stored as structured JSON string
        sowEdited: true, 
        sowErrorMessage: null, // Clear any previous errors
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    console.log(" [PROCESS] SOW Successfully Structured and Saved.");

  } catch (error: any) {
    console.error("❌ [PROCESS ERROR]", error);

    // Update DB so the UI shows the "Failed" state and the reason
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "failed",
        sowErrorMessage: error.message || "Failed to process the document text.",
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));
  }
}