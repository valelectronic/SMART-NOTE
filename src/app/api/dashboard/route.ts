export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lessonNotes, onboarding, aiUsageAnalytics, exportHistory, assessments } from "@/lib/db/schema";
import { eq, and, gte, count, desc, sum, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const usageCheckpoint = profile.lastPaymentDate || profile.createdAt;

    const [
      usageCount,
      allNotes,
      recentNotes,
      totalEdits,
      totalRegenerations,
      exportCount,
      costAnalytics,
      // ── NEW: assessment queries ──────────────────────────────────────────
      assessmentCount,
      recentAssessments,
    ] = await Promise.all([
      db.select({ value: count() })
        .from(lessonNotes)
        .where(and(
          eq(lessonNotes.userId, session.user.id),
          gte(lessonNotes.createdAt, usageCheckpoint)
        )),

      db.query.lessonNotes.findMany({
        where: eq(lessonNotes.userId, session.user.id),
        orderBy: [desc(lessonNotes.createdAt)],
      }),

      db.query.lessonNotes.findMany({
        where: eq(lessonNotes.userId, session.user.id),
        orderBy: [desc(lessonNotes.createdAt)],
        limit: 5,
      }),

      db.select({ total: sum(lessonNotes.editCount) })
        .from(lessonNotes)
        .where(eq(lessonNotes.userId, session.user.id)),

      db.select({ total: sum(lessonNotes.regenCount) })
        .from(lessonNotes)
        .where(eq(lessonNotes.userId, session.user.id)),

      db.select({ value: count() })
        .from(exportHistory)
        .where(eq(exportHistory.userId, session.user.id)),

      db.select({
        totalCost: sum(aiUsageAnalytics.estimatedCostUsd),
        cacheHits: count(sql`CASE WHEN ${aiUsageAnalytics.wasCacheHit} = true THEN 1 END`)
      })
        .from(aiUsageAnalytics)
        .where(eq(aiUsageAnalytics.userId, session.user.id)),

      // Total number of assessments generated
      db.select({ value: count() })
        .from(assessments)
        .where(eq(assessments.userId, session.user.id)),

      // 5 most recent assessments — only metadata, no content (keeps response small)
      db.query.assessments.findMany({
        where: eq(assessments.userId, session.user.id),
        columns: {
          id:          true,
          type:        true,
          format:      true,
          subject:     true,
          classLevel:  true,
          term:        true,
          objCount:    true,
          theoryCount: true,
          createdAt:   true,
        },
        orderBy: [desc(assessments.createdAt)],
        limit: 5,
      }),
    ]);

    const isPaidSubscriber = ["premium", "school"].includes(profile.subscriptionTier || "");
    const isAdminApproved  = profile.approvalStatus === "approved";
    const isPremium        = isPaidSubscriber || isAdminApproved;
    const limit            = isPremium ? 15 : 5;

    const subscriptionActive = profile.subscriptionExpiresAt
      ? new Date(profile.subscriptionExpiresAt) > new Date()
      : false;

    const daysUntilExpiry = profile.subscriptionExpiresAt
      ? Math.ceil((new Date(profile.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const notesBySubject = allNotes.reduce((acc: any, note) => {
      acc[note.subject] = (acc[note.subject] || 0) + 1;
      return acc;
    }, {});

    const timeSavedMinutes = allNotes.length * 45;
    const timeSavedHours   = Math.floor(timeSavedMinutes / 60);

    return NextResponse.json({
      profile: {
        fullName:            profile.fullName,
        schoolName:          profile.schoolName,
        schoolType:          profile.schoolType,
        subjectTaught:       profile.subjectTaught,
        teachingLevel:       profile.teachingLevel,
        subscriptionTier:    profile.subscriptionTier,
        approvalStatus:      profile.approvalStatus,
        premiumTrialUsed:    profile.premiumTrialUsed,
        subscriptionExpiresAt: profile.subscriptionExpiresAt,
        lastPaymentDate:     profile.lastPaymentDate,
      },
      stats: {
        used:                usageCount[0]?.value || 0,
        limit,
        remaining:           Math.max(0, limit - (usageCount[0]?.value || 0)),
        totalGenerated:      allNotes.length,
        totalEdits:          Number(totalEdits[0]?.total || 0),
        totalRegenerations:  Number(totalRegenerations[0]?.total || 0),
        totalExports:        exportCount[0]?.value || 0,
        timeSavedMinutes,
        timeSavedHours,
        totalCostUsd:        Number(costAnalytics[0]?.totalCost || 0),
        cacheHitCount:       costAnalytics[0]?.cacheHits || 0,
        isPremium,
        isPaidSubscriber,
        subscriptionActive,
        daysUntilExpiry,
        // ── NEW ────────────────────────────────────────────────────────────
        totalAssessments:    assessmentCount[0]?.value || 0,
      },
      insights: {
        notesBySubject,
        mostRecentSubject:   allNotes[0]?.subject || null,
        averageWordCount:    allNotes.length > 0
          ? Math.round(allNotes.reduce((sum, n) => sum + (n.wordCount || 0), 0) / allNotes.length)
          : 0,
      },
      notes:              allNotes,
      recentNotes,
      // ── NEW ──────────────────────────────────────────────────────────────
      recentAssessments,
    });

  } catch (error: any) {
    console.error("DASHBOARD_API_ERROR:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}