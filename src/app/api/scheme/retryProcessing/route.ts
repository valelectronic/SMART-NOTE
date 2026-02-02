// app/api/scheme/retryProcessing/route.ts

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { processSchemeOfWork } from "@/jobs/processSOW";
import { after } from "next/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body = await request.json();
    const { sowFileKey } = body;

    if (!sowFileKey) {
      return NextResponse.json(
        { success: false, error: "Missing sowFileKey" },
        { status: 400 }
      );
    }

    // 3. Verify the scheme belongs to this user
    const current = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });

    if (!current || current.sowFileKey !== sowFileKey) {
      return NextResponse.json(
        { success: false, error: "Scheme not found or unauthorized" },
        { status: 404 }
      );
    }

    // 4. Reset processing status to pending
    const now = new Date();
    await db
      .update(onboarding)
      .set({
        sowProcessingStatus: "pending",
        sowErrorMessage: null,
        updatedAt: now,
      })
      .where(eq(onboarding.userId, userId));

    // 5. Trigger background processing again
    after(async () => {
      console.log("Retrying SOW processing for user:", userId);
      await processSchemeOfWork(userId, sowFileKey);
    });

    return NextResponse.json({
      success: true,
      message: "Processing retry initiated",
    });
  } catch (error) {
    console.error("[RETRY PROCESSING ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to retry processing" },
      { status: 500 }
    );
  }
}