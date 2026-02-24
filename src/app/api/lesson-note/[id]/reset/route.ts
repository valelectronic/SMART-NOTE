import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessonNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.query.lessonNotes.findFirst({
      where: eq(lessonNotes.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    const [updated] = await db
      .update(lessonNotes)
      .set({
        content: existing.originalContent,
        editCount: 0,
        lastGeneratedAt: new Date(),
      })
      .where(eq(lessonNotes.id, id))
      .returning();

    return NextResponse.json({ status: "success", note: updated });

  } catch (error: any) {
    console.error("RESET_ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}