// src/app/api/scheme/deleteScheme/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding, schemeWeeks, } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function DELETE() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    console.log("=== DELETE SCHEME REQUEST ===");
    console.log("User ID:", userId);

    const result = await db.transaction(async (tx) => {
      // 1. Find the onboarding record
      const record = await tx.query.onboarding.findFirst({
        where: eq(onboarding.userId, userId),
      });

      if (!record) {
        throw new Error("Onboarding record not found");
      }

      console.log("Found onboarding record:", record.id);

      // 2. Delete all scheme weeks and subtopics
      await tx.delete(schemeWeeks).where(eq(schemeWeeks.onboardingId, record.id));
      console.log("✅ Deleted scheme weeks and subtopics");

      // 3. Clear the scheme data from onboarding
      await tx.update(onboarding)
        .set({
          sowFileKey: null,
          sowTitle: null,
          sowUploadedAt: null,
          sowErrorMessage: null,
          sowExtractedText: null,
          sowProcessingStatus: null,
          sowEdited: false,
          updatedAt: new Date(),
        })
        .where(eq(onboarding.id, record.id));

      console.log("✅ Cleared scheme data from onboarding");

      return { success: true };
    });

    // 4. Revalidate relevant paths
    revalidatePath("/community/schemeOfWork");
    revalidatePath("/community/schemeOfWork/editScheme");
    console.log("=== SCHEME DELETED SUCCESSFULLY ===");
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("[DELETE_SCHEME_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete scheme",
      },
      { status: 500 }
    );
  }
}