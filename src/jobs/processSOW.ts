import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractTextFromSOW } from "@/services/sow/extractTex";
import { cleanOcrWithAI, validateIsScheme } from "@/services/sow/aiCleaner";

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

    // ✅ FIXED: More lenient validation - allow shorter text
    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Could not extract any text from the image. Please ensure the image is clear and contains text.");
    }

    // Log the extracted text for debugging
    console.log("--- RAW EXTRACTED TEXT ---");
    console.log(`Length: ${rawText.length} characters`);
    console.log(rawText.substring(0, 500)); // First 500 chars

    // ✅ IMPROVED: Check if text is too short AFTER trimming
    const trimmedText = rawText.trim();
    if (trimmedText.length < 20) {
      throw new Error("Extracted text is too short. Please upload a clearer image of your scheme of work.");
    }

    // 3. Validate the document type with AI
    const validation = await validateIsScheme(trimmedText);

    if (!validation.isValid) {
      console.log("--- VALIDATION FAILED: ", validation.reason);
      await db.update(onboarding)
        .set({
          sowProcessingStatus: "failed",
          sowErrorMessage: validation.reason || "This image doesn't appear to be a Scheme of Work. Please upload a valid curriculum document.",
          updatedAt: new Date(),
        })
        .where(eq(onboarding.userId, userId));
      return;
    }

    // 4. AI CLEANUP STEP - Parse the text into structured data
    const parsedScheme = await cleanOcrWithAI(trimmedText);

    // Debug output
    console.log("--- AI CLEANED & PARSED SCHEME ---");
    console.log(`Found ${parsedScheme?.length || 0} weeks`);
    console.dir(parsedScheme, { depth: null });

    // ✅ IMPROVED: Better validation of parsed results
    if (!parsedScheme || !Array.isArray(parsedScheme) || parsedScheme.length === 0) {
      // If AI couldn't parse it, provide helpful error
      throw new Error(
        "Could not identify any weekly topics in your scheme. Please ensure your document contains week numbers and topics clearly labeled."
      );
    }

    // ✅ ADDITIONAL: Validate that we have meaningful data
    const validWeeks = parsedScheme.filter(week => 
      week.topicTitle && week.topicTitle.trim().length > 0
    );

    if (validWeeks.length === 0) {
      throw new Error(
        "Found week entries but no topic titles. Please ensure your scheme includes topic names for each week."
      );
    }

    console.log(`✅ Successfully parsed ${validWeeks.length} valid weeks`);

    // 5. Save the results and mark as complete
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "complete",
        sowExtractedText: JSON.stringify(validWeeks), // Save only valid weeks
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

    console.log("--- PROCESS SUCCESSFUL ---");

  } catch (error) {
    console.error("[SOW PROCESS ERROR]", error);

    // ✅ IMPROVED: More user-friendly error messages
    let errorMessage = "Failed to process your scheme of work.";
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Add helpful tips based on error type
    if (errorMessage.includes("too short") || errorMessage.includes("extract")) {
      errorMessage += " Try taking a clearer photo with better lighting.";
    } else if (errorMessage.includes("weekly topics")) {
      errorMessage += " Make sure your document shows week numbers (Week 1, Week 2, etc.) and topic titles.";
    }

    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "failed",
        sowErrorMessage: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));
  }
}

// ✅ HELPER FUNCTION: Add this to help with debugging
export async function validateSchemeUpload(rawText: string): Promise<{
  isValid: boolean;
  reason?: string;
  stats: {
    totalLength: number;
    trimmedLength: number;
    hasWeekNumbers: boolean;
    estimatedWeeks: number;
  };
}> {
  const trimmed = rawText.trim();
  
  // Check for week-related keywords
  const weekPatterns = [
    /week\s*\d+/gi,
    /wk\s*\d+/gi,
    /\d+\s*week/gi,
  ];
  
  const weekMatches = weekPatterns.reduce((count, pattern) => {
    const matches = trimmed.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);

  return {
    isValid: trimmed.length >= 20 && weekMatches > 0,
    reason: trimmed.length < 20 
      ? "Document is too short" 
      : weekMatches === 0 
      ? "No week numbers found in document"
      : undefined,
    stats: {
      totalLength: rawText.length,
      trimmedLength: trimmed.length,
      hasWeekNumbers: weekMatches > 0,
      estimatedWeeks: weekMatches,
    }
  };
}