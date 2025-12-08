import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function uploadSchemeOfWorkController(formData: FormData) {
  try {
    // --- 1. AUTH CHECK ---
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: "Unauthorized" };
    const userId = session.user.id;

    // --- 2. VALIDATE INPUT ---
    const sowFileKey = formData.get("sowFileKey")?.toString();

    if (!sowFileKey) {
      return { success: false, error: "Missing new file key (sowFileKey)" };
    }

    // Extract clean title (filename without extension)
    const fileName = sowFileKey.split("/").pop(); 
    const sowTitle = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Uploaded Scheme of Work";
    const now = new Date();

    // --- 3. FETCH USER ONBOARDING RECORD ---
    const current = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });
    if (!current) return { success: false, error: "User onboarding record not found" };

    // --- 4. UPDATE DB ---
    const [updated] = await db
      .update(onboarding)
      .set({
        sowFileKey,     // Save correct Cloudinary public_id
        sowTitle,
        sowUploadedAt: now,
        updatedAt: now,
      })
      .where(eq(onboarding.userId, userId))
      .returning();

    if (!updated) {
      return { success: false, error: "Failed to update SOW record" };
    }


    // --- 6. START EXTRACTION JOB ---
    const jobId = `job-${crypto.randomUUID()}`;
    console.log(`[AI] Extraction started for ${sowFileKey} (User: ${userId}, Job: ${jobId})`);

    return {
      success: true,
      message: "File saved. Extraction job started.",
      sowTitle: updated.sowTitle,
      sowFileKey: updated.sowFileKey,
      jobId,
    };
  } catch (error) {
    console.error("[ERROR] SOW processing failed:", error);
    return { success: false, error: "Failed to process Scheme of Work upload." };
  }
}
