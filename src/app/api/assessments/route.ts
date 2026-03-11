// app/api/assessments/route.ts
// GET — Returns the current user's saved assessments (for dashboard listing).
// Excludes `content` by default — frontend fetches full content separately
// when teacher clicks "View" to keep the list response small.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const rows = await db.query.assessments.findMany({
      where: eq(assessments.userId, session.user.id),
      columns: {
        id:           true,
        type:         true,
        format:       true,
        subject:      true,
        classLevel:   true,
        term:         true,
        objCount:     true,
        theoryCount:  true,
        providerUsed: true,
        createdAt:    true,
        // content excluded — fetched only when teacher opens the paper
      },
      orderBy: [desc(assessments.createdAt)],
    });

    return NextResponse.json({ assessments: rows });

  } catch (err: any) {
    console.error("[/api/assessments GET]", err);
    return NextResponse.json({ error: "Failed to fetch assessments." }, { status: 500 });
  }
}