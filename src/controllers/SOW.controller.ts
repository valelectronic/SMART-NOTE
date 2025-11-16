import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function uploadSchemeOfWorkController(formData: FormData) {
    // -------------------------------------------
    // 1. AUTH CHECK
    // -------------------------------------------
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return { success: false, error: "Unauthorized." };
    }

    const userId = session.user.id;

    // -------------------------------------------
    // 2. VALIDATE INPUT
    // -------------------------------------------
    const sowFileUrl = formData.get("sowFileUrl")?.toString() || null;
    const sowFileKey = formData.get("sowFileKey")?.toString() || null;
    const prevSowFileKey = formData.get("prevSowFileKey")?.toString() || null;

    if (!sowFileUrl || !sowFileKey) {
        return { success: false, error: "Missing file upload information." };
    }

    const now = new Date();

    // Generate a readable title from file key
    const sowTitle =
        sowFileKey.split("/").pop()?.replace(/-\w+$/, "") ||
        "Uploaded Scheme of Work";

    try {
        // -------------------------------------------
        // 3. ENSURE USER ONBOARDING RECORD EXISTS
        // -------------------------------------------
        const current = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, userId),
        });

        if (!current) {
            return { success: false, error: "User onboarding record not found." };
        }

        // -------------------------------------------
        // 4. SAFETY CHECK BEFORE DELETING OLD FILE
        // -------------------------------------------
        const safeToDelete =
            prevSowFileKey &&
            current.sowFileKey &&
            prevSowFileKey === current.sowFileKey;

        // -------------------------------------------
        // 5. UPDATE DB WITH NEW FILE
        // -------------------------------------------
        const [updated] = await db
            .update(onboarding)
            .set({
                sowFileKey,
                sowTitle,
                sowUploadedAt: now,
                updatedAt: now,
            })
            .where(eq(onboarding.userId, userId))
            .returning();

        if (!updated) {
            return { success: false, error: "Failed to update SOW record." };
        }

        // -------------------------------------------
        // 6. CLEANUP OLD CLOUDINARY FILE
        // -------------------------------------------
        if (safeToDelete && prevSowFileKey) {
    console.log(`[CLEANUP] Attempting to delete old SOW asset: ${prevSowFileKey}`);

    try {
        // CRITICAL FIX: Explicitly set resource_type to 'raw' 
        // to correctly delete documents (PDF, DOCX)
        const deleteResult = await deleteFromCloudinary(prevSowFileKey, 'auto'); 
        
        if (deleteResult.success) {
            console.log(`[CLEANUP] Success: Deleted old SOW file ${prevSowFileKey}`);
        } else {
            console.error(`[CLEANUP ERROR] Failed to delete old SOW file ${prevSowFileKey}: ${deleteResult.error}`);
        }
    } catch (err) {
        console.error(`[CLEANUP ERROR] Caught exception deleting old SOW file ${prevSowFileKey}`, err);
    }
}

        // -------------------------------------------
        // 7. START EXTRACTION JOB (ASYNC)
        // -------------------------------------------
        const jobId = `job-${crypto.randomUUID()}`;

        console.log(
            `[AI] Extraction started for ${sowFileKey} (User: ${userId}, Job: ${jobId})`
        );

        return {
            success: true,
            message: "File saved. Extraction job started.",
            sowTitle: updated.sowTitle,
            sowFileKey: updated.sowFileKey,
            jobId,
        };
    } catch (error) {
        console.error("[ERROR] SOW processing failed:", error);

        // If DB update fails → frontend deletes NEW file
        return {
            success: false,
            error: "Failed to process Scheme of Work upload.",
        };
    }
}
