import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { processSchemeOfWork } from "@/jobs/processSOW";
import { after } from "next/server";
import { revalidatePath } from "next/cache";

export async function createSchemeRecordController(
  body: { sowFileKey: string; rawText: string },
  headersList: Headers
) {
  try {
    // --- 1. AUTH ---
    const session = await auth.api.getSession({ headers: headersList});
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // --- 2. VALIDATION ---
    const { sowFileKey, rawText } = body;

    if (!sowFileKey) {
      return { success: false, error: "Missing sowFileKey" };
    }

    // --- 3. TITLE ---
    const fileName = sowFileKey.split("/").pop();
    const sowTitle =
      fileName?.replace(/\.[^/.]+$/, "") ?? "Uploaded Scheme of Work";

    const now = new Date();

    // --- 4. FETCH USER RECORD ---
    const current = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });

    if (!current) {
      return { success: false, error: "User onboarding record not found" };
    }

    // --- 5. SAVE METADATA ---
    const [updated] = await db
      .update(onboarding)
      .set({
        sowFileKey,
        sowTitle,
        sowUploadedAt: now,
        sowProcessingStatus: "processing",
        sowErrorMessage: null,
        updatedAt: now,
      })
      .where(eq(onboarding.userId, userId))
      .returning();

    if (!updated) {
      return { success: false, error: "Failed to save scheme" };
    }
    // --- 6. REVALIDATE ---
    revalidatePath("/community/schemeOfWork");


    // Trigger background job to process SOW
    if (rawText) {
      after(async () => {
        console.log("Starting fast AI cleanup with pre-extracted text...");
        // Pass rawText into your processing function
        await processSchemeOfWork(userId, rawText); 
      });
    } else {
      console.warn("No rawText provided. OCR will fail on serverless.");
    }

    return {
      success: true,
      sowTitle,
      sowFileKey,
      processingStatus: "processing",
    };
  } catch (error) {
    console.error("[SOW CREATE ERROR]", error);
    return { success: false, error: "Failed to create scheme record" };
  }
}
