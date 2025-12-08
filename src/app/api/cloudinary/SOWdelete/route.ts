import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function DELETE() {
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

    // --- 2. GET CURRENT USER SOW ---
    const record = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
    });

    const publicId = record?.sowFileKey;

    if (!publicId) {
      return NextResponse.json({
        success: false,
        error: "No Scheme of Work found",
      });
    }

    // --- 3. DELETE FROM CLOUDINARY ---
    console.log("[SOW Delete] Deleting public_id:", publicId);

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

    // --- 4. CLEAR DATABASE ENTRY ---
    await db
      .update(onboarding)
      .set({
        sowFileKey: null,
        sowTitle: null,
        sowUploadedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(onboarding.userId, userId));

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
