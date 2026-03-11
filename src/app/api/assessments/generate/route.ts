// app/api/assessments/generate/route.ts
// POST — Premium only. Enforces per-cycle quotas by assessment type.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assessments, lessonNotes, onboarding, aiUsageAnalytics } from "@/lib/db/schema";
import { eq, and, inArray, gte, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateAssessment, AssessmentConfig } from "@/services/ai-service";

// ── Quota definitions ─────────────────────────────────────────────────────────
// These are per billing cycle (since lastPaymentDate for premium, since createdAt for free).
// When a teacher pays again, lastPaymentDate updates → counts reset automatically.
const QUOTAS = {
  premium: { Exam: 1, Test: 2, Assignment: 3 },
  free:    { Exam: 0, Test: 1, Assignment: 1 },
} as const;

type AssessmentType = "Exam" | "Test" | "Assignment";

export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth ───────────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const userId = session.user.id;

    // ── 2. Load profile ───────────────────────────────────────────────────────
    const profile = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, userId),
      columns: {
        id:                   true,
        subscriptionTier:     true,
        subscriptionExpiresAt: true,
        lastPaymentDate:      true,
        createdAt:            true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found. Complete onboarding first." }, { status: 403 });
    }

    // ── 3. Premium check ──────────────────────────────────────────────────────
    const isPremium =
      profile.subscriptionTier === "premium" ||
      profile.subscriptionTier === "school";
    const isExpired =
      profile.subscriptionExpiresAt && profile.subscriptionExpiresAt < new Date();

    // Free users can generate assignments and tests only — not exams
    // Premium users get full access but still have per-cycle quotas
    const quota = isPremium && !isExpired ? QUOTAS.premium : QUOTAS.free;

    // ── 4. Parse and validate body ────────────────────────────────────────────
    const body = await req.json();
    const { selectedNoteIds, config }: {
      selectedNoteIds: string[];
      config: AssessmentConfig;
    } = body;

    if (!selectedNoteIds?.length) {
      return NextResponse.json({ error: "Select at least one lesson note." }, { status: 400 });
    }
    if (!config?.type || !config?.format || !config?.subject || !config?.classLevel) {
      return NextResponse.json({ error: "Missing required config fields." }, { status: 400 });
    }

    const assessmentType = config.type as AssessmentType;

    // ── 5. Quota check ────────────────────────────────────────────────────────
    const typeLimit = quota[assessmentType];

    if (typeLimit === 0) {
      return NextResponse.json({
        error: `Exam generation is a premium feature. Upgrade to generate exams.`,
        code: "UPGRADE_REQUIRED",
      }, { status: 403 });
    }

    // Count how many of this type the teacher has generated since their
    // last payment (premium) or since they joined (free).
    // When they pay again, lastPaymentDate updates → checkpoint moves → count resets.
    const checkpoint = profile.lastPaymentDate ?? profile.createdAt;

    const [usageRow] = await db
      .select({ value: count() })
      .from(assessments)
      .where(and(
        eq(assessments.userId, userId),
        eq(assessments.type, assessmentType),
        gte(assessments.createdAt, checkpoint),
      ));

    const usedCount = usageRow?.value ?? 0;

    if (usedCount >= typeLimit) {
      const tierLabel = isPremium && !isExpired ? "premium" : "free";
      const upgradeMsg = tierLabel === "free"
        ? `You've used your free ${assessmentType.toLowerCase()} (${typeLimit} allowed). Upgrade to Premium for more.`
        : `You've reached your ${assessmentType.toLowerCase()} limit for this billing cycle (${typeLimit} allowed). It resets when you renew.`;

      return NextResponse.json({
        error: upgradeMsg,
        code: "QUOTA_EXCEEDED",
        used: usedCount,
        limit: typeLimit,
        type: assessmentType,
        tier: tierLabel,
      }, { status: 403 });
    }

    // ── 6. Note count cap ─────────────────────────────────────────────────────
    const maxNotes = assessmentType === "Exam" ? 10 : 3;
    if (selectedNoteIds.length > maxNotes) {
      return NextResponse.json(
        { error: `Maximum ${maxNotes} notes allowed for a ${assessmentType}.` },
        { status: 400 }
      );
    }

    // ── 7. Question count caps ────────────────────────────────────────────────
    const safeObjCount    = Math.min(Math.max(config.objCount    ?? 0, 0), 20);
    const safeTheoryCount = Math.min(Math.max(config.theoryCount ?? 0, 0), 10);
    if (config.format === "Mixed" && safeObjCount + safeTheoryCount > 30) {
      return NextResponse.json({ error: "Mixed format: total questions cannot exceed 30." }, { status: 400 });
    }
    if (config.format === "Objectives" && safeObjCount === 0) {
      return NextResponse.json({ error: "Objectives format requires at least 1 objective question." }, { status: 400 });
    }
    if (config.format === "Theory" && safeTheoryCount === 0) {
      return NextResponse.json({ error: "Theory format requires at least 1 theory question." }, { status: 400 });
    }

    // ── 8. Fetch only this user's selected notes ──────────────────────────────
    const notes = await db.query.lessonNotes.findMany({
      where: and(
        eq(lessonNotes.userId, userId),
        inArray(lessonNotes.id, selectedNoteIds)
      ),
      columns: { id: true, content: true, topic: true, subject: true },
    });

    if (notes.length === 0) {
      return NextResponse.json({ error: "No matching lesson notes found for your account." }, { status: 404 });
    }

    // ── 9. Generate ───────────────────────────────────────────────────────────
    const safeConfig: AssessmentConfig = {
      ...config,
      objCount:    safeObjCount,
      theoryCount: safeTheoryCount,
    };

    const startTime = Date.now();
    const result    = await generateAssessment(notes, safeConfig);
    const duration  = Date.now() - startTime;

    // ── 10. Save to DB ────────────────────────────────────────────────────────
    const [saved] = await db
      .insert(assessments)
      .values({
        userId,
        onboardingId:  profile.id,
        type:          safeConfig.type,
        format:        safeConfig.format,
        subject:       safeConfig.subject,
        classLevel:    safeConfig.classLevel,
        term:          safeConfig.term     ?? null,
        duration:      safeConfig.duration ?? null,
        objCount:      safeObjCount,
        theoryCount:   safeTheoryCount,
        sourceNoteIds: notes.map(n => n.id).join(","),
        content:       result.text,
        aiModelUsed:   result.provider,
        providerUsed:  result.provider.includes("groq") ? "groq" : "anthropic",
      })
      .returning({ id: assessments.id });

    // ── 11. Log analytics ─────────────────────────────────────────────────────
    const hasCacheHit = (result.usage.cacheReadTokens ?? 0) > 0;
    await db.insert(aiUsageAnalytics).values({
      userId,
      onboardingId:     profile.id,
      action:           "assessment_generation",
      topicTitle:       `${safeConfig.type} — ${safeConfig.subject} ${safeConfig.classLevel}`,
      promptTokens:     result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      aiProvider:       result.provider.includes("groq") ? "groq" : "anthropic",
      aiModel:          result.provider,
      wasCacheHit:      hasCacheHit,
    });

    // ── 12. Return — include remaining quota so frontend can show it ──────────
    return NextResponse.json({
      id:        saved.id,
      content:   result.text,
      provider:  result.provider,
      duration,
      quota: {
        type:      assessmentType,
        used:      usedCount + 1,
        limit:     typeLimit,
        remaining: typeLimit - usedCount - 1,
      },
    });

  } catch (err: any) {
    console.error("[/api/assessments/generate]", err);
    return NextResponse.json(
      { error: err.message ?? "Assessment generation failed. Please try again." },
      { status: 500 }
    );
  }
}