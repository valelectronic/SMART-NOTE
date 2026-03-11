// app/api/assessments/[id]/route.ts
// GET — Returns a single assessment with full content.
// Only accessible by the owner.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const row = await db.query.assessments.findFirst({
      where: and(
        eq(assessments.id, id),
        eq(assessments.userId, session.user.id) // owner check
      ),
    });

    if (!row) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    return NextResponse.json({ assessment: row });

  } catch (err: any) {
    console.error("[/api/assessments/[id] GET]", err);
    return NextResponse.json({ error: "Failed to fetch assessment." }, { status: 500 });
  }
}

// DELETE — Teacher removes an assessment from their history
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const deleted = await db
      .delete(assessments)
      .where(
        and(
          eq(assessments.id, id),
          eq(assessments.userId, session.user.id) // owner check
        )
      )
      .returning({ id: assessments.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[/api/assessments/[id] DELETE]", err);
    return NextResponse.json({ error: "Failed to delete assessment." }, { status: 500 });
  }
}