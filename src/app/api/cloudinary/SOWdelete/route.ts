import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function DELETE(req: NextRequest) {
  try {
    // --- 1. AUTH ---
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // --- 2. GET KEY FROM QUERY PARAM ---
    const url = new URL(req.url);
    const publicId = url.searchParams.get("key");

    if (!publicId) {
      return NextResponse.json({
        success: false,
        error: "No Scheme of Work key provided",
      });
    }

    console.log(`[SOW Delete] User: ${userId}, Deleting public_id: ${publicId}`);

    // --- 3. DELETE FROM CLOUDINARY ---
    const result = await deleteFromCloudinary(publicId);

    if (result.success) {
      console.log(
        `[SOW Delete] Successfully deleted from Cloudinary → public_id: ${publicId} | resource_type_used: ${result.typeUsed}`
      );
    } else {
      console.warn(
        `[SOW Delete] Cloudinary deletion failed: ${result.error}. Proceeding to clear DB anyway.`
      );
    }

    // --- 4. CLEAR DATABASE ENTRY IF IT MATCHES THE KEY ---
    const record = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });

    if (record?.sowFileKey === publicId) {
      await db.update(onboarding)
        .set({
          sowFileKey: null,
          sowTitle: null,
          sowUploadedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(onboarding.userId, userId));

      console.log(`[SOW Delete] DB entry cleared for user: ${userId}`);
    } else {
      console.log(`[SOW Delete] No matching DB entry to clear for user: ${userId}`);
    }

    return NextResponse.json({
      success: true,
      message: "Scheme of Work deleted successfully",
    });

  } catch (error) {
    console.error("[SOW Delete Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete Scheme of Work" },
      { status: 500 }
    );
  }
}
