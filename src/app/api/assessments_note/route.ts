export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessonNotes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notes = await db.query.lessonNotes.findMany({
      where: eq(lessonNotes.userId, session.user.id),
      columns: {
        id:         true,
        subject:    true,
        topic:      true,
        gradeLevel: true,
        createdAt:  true,
      },
      orderBy: [desc(lessonNotes.createdAt)],
      limit: 50,
    });

    return NextResponse.json({ lessonNotes: notes });

  } catch (error: any) {
    console.error("[GET /api/notes]", error);
    return NextResponse.json({ error: "Failed to fetch notes." }, { status: 500 });
  }
}