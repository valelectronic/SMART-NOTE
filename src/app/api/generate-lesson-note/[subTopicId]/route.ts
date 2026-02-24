import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessonNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET(
  req: Request,
  context: { params: Promise<{ subTopicId: string }> } // note Promise here
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params; // <- unwrap the Promise
    const { subTopicId } = params;

    console.log("📥 GET /api/lesson-note", subTopicId);

    const existingNote = await db.query.lessonNotes.findFirst({
      where: eq(lessonNotes.schemeSubTopicId, subTopicId),
    });

    if (!existingNote) {
      return NextResponse.json({ note: null }, { status: 200 });
    }

    return NextResponse.json({ note: existingNote }, { status: 200 });
  } catch (error: any) {
    console.error("FETCH_NOTE_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch note" },
      { status: 500 }
    );
  }
}
