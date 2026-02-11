// jobs/processSOW.ts (or wherever your processing logic lives)

import { db } from "@/lib/db";
import { onboarding, schemeSubTopics,schemeWeeks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cleanOcrWithAI, validateIsScheme } from "@/services/sow/aiCleaner";

/**
 *  High-Speed AI Processing
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

    // 3️⃣ FINAL RELATIONAL SAVE
    await db.transaction(async (tx) => {
      // Find the onboarding ID first
      const userOnboarding = await tx.query.onboarding.findFirst({
        where: eq(onboarding.userId, userId),
      });

      if (!userOnboarding) throw new Error("Onboarding record not found.");

      // A. Delete existing weeks/topics to prevent duplicates if they re-upload
      // This is the "Clear old scheme" part you wanted
      const existingWeeks = await tx.select().from(schemeWeeks).where(eq(schemeWeeks.onboardingId, userOnboarding.id));
      for (const week of existingWeeks) {
        await tx.delete(schemeSubTopics).where(eq(schemeSubTopics.schemeWeekId, week.id));
      }
      await tx.delete(schemeWeeks).where(eq(schemeWeeks.onboardingId, userOnboarding.id));

      // B. Insert the new structure
      for (const item of normalizedWeeks) {
        // Create the Week row
        const [newWeek] = await tx.insert(schemeWeeks).values({
          onboardingId: userOnboarding.id,
          weekNumber: item.weekNumber,
          term: "First Term", // Default or extract from rawText if available
        }).returning();

        // Create the Sub-Topic row linked to that week
        await tx.insert(schemeSubTopics).values({
          schemeWeekId: newWeek.id,
          topicTitle: item.topicTitle,
          topicContent: item.content || "",
          notesGenerated: false,
        });
      }

      // C. Update Onboarding Status
      await tx.update(onboarding)
        .set({
          sowProcessingStatus: "complete",
          sowEdited: true, 
          sowErrorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(onboarding.userId, userId));
    });

    console.log(" [PROCESS] Relational Data Successfully Saved.");

  } catch (error: any) {
    console.error(" [PROCESS ERROR]", error);

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