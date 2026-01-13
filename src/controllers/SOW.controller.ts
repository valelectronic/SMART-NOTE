import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createSchemeRecordController(
  body: { sowFileKey: string }
) {
  try {
    // --- 1. AUTH ---
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = session.user.id;

    // --- 2. VALIDATION ---
    const { sowFileKey } = body;

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
        sowProcessingStatus: "pending",
        sowErrorMessage: null,
        updatedAt: now,
      })
      .where(eq(onboarding.userId, userId))
      .returning();

    if (!updated) {
      return { success: false, error: "Failed to save scheme" };
    }

    return {
      success: true,
      sowTitle,
      sowFileKey,
      processingStatus: "pending",
    };
  } catch (error) {
    console.error("[SOW CREATE ERROR]", error);
    return { success: false, error: "Failed to create scheme record" };
  }
}
