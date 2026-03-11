// app/api/assessments/quota/route.ts
// GET — Returns the teacher's assessment usage for the current billing cycle.
// Used by the frontend to show quota bars before generation.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments, onboarding } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

const QUOTAS = {
  premium: { Exam: 1, Test: 2, Assignment: 3 },
  free:    { Exam: 0, Test: 1, Assignment: 1 },
} as const;

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const userId = session.user.id;

    const profile = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
      columns: {
        subscriptionTier:      true,
        subscriptionExpiresAt: true,
        lastPaymentDate:       true,
        createdAt:             true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const isPremium =
      (profile.subscriptionTier === "premium" || profile.subscriptionTier === "school") &&
      (!profile.subscriptionExpiresAt || profile.subscriptionExpiresAt > new Date());

    const quota  = isPremium ? QUOTAS.premium : QUOTAS.free;
    const tier   = isPremium ? "premium" : "free";

    // Checkpoint — premium resets on payment, free resets never (uses join date)
    const checkpoint = profile.lastPaymentDate ?? profile.createdAt;

    // Count each type since checkpoint in parallel
    const [examCount, testCount, assignCount] = await Promise.all([
      db.select({ value: count() }).from(assessments).where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, "Exam"),
        gte(assessments.createdAt, checkpoint),
      )),
      db.select({ value: count() }).from(assessments).where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, "Test"),
        gte(assessments.createdAt, checkpoint),
      )),
      db.select({ value: count() }).from(assessments).where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, "Assignment"),
        gte(assessments.createdAt, checkpoint),
      )),
    ]);

    return NextResponse.json({
      tier,
      Exam:       { used: examCount[0]?.value   ?? 0, limit: quota.Exam       },
      Test:       { used: testCount[0]?.value   ?? 0, limit: quota.Test       },
      Assignment: { used: assignCount[0]?.value ?? 0, limit: quota.Assignment },
    });

  } catch (err: any) {
    console.error("[GET /api/assessments/quota]", err);
    return NextResponse.json({ error: "Failed to fetch quota." }, { status: 500 });
  }
}