import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessonNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  // ✅ FIX: In Next.js 15, params MUST be a Promise
  context: { params: Promise<{ id: string }> } 
) {
  try {
    // ✅ FIX: You MUST await the params before using the id
    const { id } = await context.params;

    // 1️⃣ Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Fetch existing note
    const existing = await db.query.lessonNotes.findFirst({
      where: eq(lessonNotes.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // 3️⃣ Ownership check
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4️⃣ Validate original content
    if (!existing.originalContent) {
      return NextResponse.json(
        { error: "No original version stored for this note." },
        { status: 400 }
      );
    }

    if (existing.content === existing.originalContent) {
      return NextResponse.json(
        { error: "Note is already at its original version." },
        { status: 400 }
      );
    }

    // 5️⃣ Reset note content
    const [updated] = await db
      .update(lessonNotes)
      .set({
        content: existing.originalContent,
        editCount: 0,
        lastGeneratedAt: new Date(),
      })
      .where(eq(lessonNotes.id, id))
      .returning();

    // 6️⃣ Return success
    return NextResponse.json({ status: "success", note: updated });
  } catch (error: unknown) { // ✅ FIX: Use 'unknown' instead of 'any' for clean build
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    console.error("RESET_ROUTE_ERROR:", errorMessage);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}