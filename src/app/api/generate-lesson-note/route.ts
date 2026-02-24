import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboarding, schemeSubTopics, lessonNotes } from "@/lib/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { generateLessonNote, refineLessonNote } from "@/services/ai-service";
import { fetchAlocQuestions, formatAlocQuestionsForNote } from "@/services/aloc-service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";

const requestSchema = z.object({
  subTopicId: z.string().uuid(),
  instruction: z.string().max(500).optional(),
  forceRegenerate: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    // 1️⃣ AUTH
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subTopicId, instruction, forceRegenerate } =
      requestSchema.parse(body);

    // 2️⃣ FETCH CONTEXT
    const [teacherProfile, topicData, existingNote] = await Promise.all([
      db.query.onboarding.findFirst({
        where: eq(onboarding.userId, session.user.id),
      }),
      db.query.schemeSubTopics.findFirst({
        where: eq(schemeSubTopics.id, subTopicId),
        with: {
          schemeWeek: true,  // pull parent week so we get term + weekNumber
        },
      }),
      db.query.lessonNotes.findFirst({
        where: eq(lessonNotes.schemeSubTopicId, subTopicId),
      }),
    ]);

    if (!teacherProfile || !topicData)
      return NextResponse.json({ error: "Context missing" }, { status: 404 });

    // 3️⃣ GENERATION TYPE
    const isRefinement = !!(existingNote && instruction);
    const isRegeneration = !!(existingNote && forceRegenerate);
    const isNewNote = !existingNote;

    const generationType: "new" | "refinement" | "forced-regeneration" =
      isRefinement
        ? "refinement"
        : isRegeneration
        ? "forced-regeneration"
        : "new";

    // 4️⃣ SMART CACHE
    if (existingNote && !instruction && !forceRegenerate) {
      return NextResponse.json({
        status: "success",
        data: existingNote,
        source: "cache",
        cacheTimestamp: existingNote.lastGeneratedAt,
      });
    }

    // 5️⃣ PREMIUM STATUS
    // ✅ FIX: "free" removed — it is not a paid tier
    const isPaidSubscriber = ["premium", "school"].includes(
      teacherProfile.subscriptionTier || ""
    );
    const isAdminApproved = teacherProfile.approvalStatus === "approved";
    const canUseTrial = !teacherProfile.premiumTrialUsed;
    const isPremiumActive = isPaidSubscriber || isAdminApproved || canUseTrial;

    // ✅ FIX: Added `code` field to all 403 responses so the frontend can branch correctly

    // BLOCK FREE REGENERATION
    if (isRegeneration && !isPaidSubscriber && !isAdminApproved) {
      return NextResponse.json(
        {
          error: "Regeneration is a Premium feature.",
          code: "PREMIUM_REQUIRED",
        },
        { status: 403 }
      );
    }

    // LIMIT PREMIUM TO 1 REGENERATION
    if (isRegeneration && existingNote && existingNote.regenCount >= 1) {
      return NextResponse.json(
        {
          error:
            "You have already regenerated this note once. Use refinement instead.",
          code: "REGENERATE_LIMIT",
        },
        { status: 403 }
      );
    }

    // 6️⃣ USAGE QUOTA
    const usageCheckpoint =
      teacherProfile.lastPaymentDate || teacherProfile.createdAt;

    const [usageResult] = await db
      .select({ value: count() })
      .from(lessonNotes)
      .where(
        and(
          eq(lessonNotes.userId, session.user.id),
          gte(lessonNotes.createdAt, usageCheckpoint)
        )
      );

    const notesUsed = usageResult?.value || 0;
    const NOTE_LIMIT = isPaidSubscriber || isAdminApproved ? 17: 5;

    // ONLY NEW NOTES CONSUME QUOTA
    if (isNewNote && notesUsed >= NOTE_LIMIT) {
      return NextResponse.json(
        {
      error: isPaidSubscriber 
        ? "You have used your 17 premium notes. Please upgrade again." 
        : "Free limit of 5 notes reached. Upgrade to Premium!",
      code: "LIMIT_REACHED",
    },
        { status: 403 }
      );
    }

    // EDIT LIMIT
    // Premium gets 15 refinements; free/trial users get 3
    const EDIT_LIMIT = isPremiumActive ? 5 : 2;

    if (isRefinement && existingNote && existingNote.editCount >= EDIT_LIMIT) {
      return NextResponse.json(
        {
          error: `Refinement limit reached (${existingNote.editCount}/${EDIT_LIMIT}).`,
          code: "EDIT_LIMIT",
        },
        { status: 403 }
      );
    }

    // 7️⃣ AI EXECUTION
    let aiResponse: any;
    const startTime = Date.now();

    if (generationType === "refinement" && existingNote) {
      aiResponse = await refineLessonNote(existingNote.content, instruction!, isPremiumActive);
    } else {
      aiResponse = await generateLessonNote(
        {
          subject: teacherProfile.subjectTaught,
          class: teacherProfile.teachingLevel,
          topic: topicData.topicTitle,
          term: topicData.schemeWeek?.term ?? "Not specified",
          teacherName: teacherProfile.fullName ?? "Not specified",
          schoolName: teacherProfile.schoolName ?? "Not specified",
          week: topicData.schemeWeek?.weekNumber
            ? `Week ${topicData.schemeWeek.weekNumber}`
            : "Not specified",
        },
        isPremiumActive
      );
    }

    if (!aiResponse?.text) throw new Error("AI failed to generate response.");

    let contentText: string = aiResponse.text;
    const aiProvider: string = aiResponse.provider;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // ── ALOC PAST QUESTIONS INJECTION ──────────────────────────────────────
    // Only for SSS subjects — JSS/Primary fall back to AI-generated questions
    // Runs AFTER AI generation so it never blocks or delays the main response
    if (!isRefinement) {
      try {
        const alocResult = await fetchAlocQuestions(
          teacherProfile.subjectTaught,
          teacherProfile.teachingLevel,
          4, // fetch 4 real questions for Section G
          "waec"
        );
        if (alocResult) {
          // Replace Section G in the AI note with real ALOC questions
          const alocBlock = formatAlocQuestionsForNote(alocResult);
          // If AI already wrote a Section G, replace it; otherwise append
          if (contentText.includes("G. ASSIGNMENT")) {
            contentText = contentText.replace(
              /G\. ASSIGNMENT[\s\S]*?(H\. TEXTBOOK|$)/,
              alocBlock + "\n\nH. TEXTBOOK"
            );
          } else {
            contentText = contentText + "\n\n" + alocBlock;
          }
        }
      } catch (alocErr) {
        // ALOC failure must never crash note generation — log and continue
        console.warn("ALOC injection skipped:", alocErr);
      }
    }

    // 8️⃣ DATABASE TRANSACTION
    const result = await db.transaction(async (tx) => {
      // ATOMIC QUOTA CHECK
      if (isNewNote) {
        const [atomicCount] = await tx
          .select({ value: count() })
          .from(lessonNotes)
          .where(
            and(
              eq(lessonNotes.userId, session.user.id),
              gte(lessonNotes.createdAt, usageCheckpoint)
            )
          );
          const totalUsedAfterThis = (atomicCount?.value || 0) + 1;

              if ((atomicCount?.value || 0) >= NOTE_LIMIT)
                throw new Error("QUOTA_EXHAUSTED");

                if (isPaidSubscriber && totalUsedAfterThis >= 17) {
        await tx
          .update(onboarding)
          .set({ subscriptionTier: "free" })
          .where(eq(onboarding.id, teacherProfile.id));
      }

      // Burn trial once
      if (!isPaidSubscriber && !isAdminApproved && canUseTrial) {
        await tx
          .update(onboarding)
          .set({
            premiumTrialUsed: true,
            premiumTrialUsedAt: new Date(),
          })
          .where(eq(onboarding.id, teacherProfile.id));
      }
      }
      

      const metadata = {
        editCount: isRefinement
          ? (existingNote?.editCount || 0) + 1
          : existingNote?.editCount || 0,
        regenCount: isRegeneration
          ? (existingNote?.regenCount || 0) + 1
          : existingNote?.regenCount || 0,
        lastGeneratedAt: new Date(),
        aiModelUsed: aiProvider,
        generationTime: duration,
        wordCount: contentText.split(/\s+/).length,
      };

      let finalNote;

      if (existingNote) {
        [finalNote] = await tx
          .update(lessonNotes)
          .set({ content: contentText, ...metadata })
          .where(eq(lessonNotes.id, existingNote.id))
          .returning();
      } else {
        [finalNote] = await tx
          .insert(lessonNotes)
          .values({
            userId: session.user.id,
            onboardingId: teacherProfile.id,
            schemeSubTopicId: topicData.id,
            title: topicData.topicTitle,
            subject: teacherProfile.subjectTaught,
            topic: topicData.topicTitle,
            gradeLevel: teacherProfile.teachingLevel,
            curriculum: teacherProfile.curriculumStandard,
            formatUsed: teacherProfile.preferredNoteFormat || "structured_table",
            content: contentText,
            originalContent: contentText,
            ...metadata,
          })
          .returning();

        await tx
          .update(schemeSubTopics)
          .set({ notesGenerated: true })
          .where(eq(schemeSubTopics.id, subTopicId));
      }

      return finalNote;
    });

    // ✅ FIX: Added `source: "ai"` and `usedPremiumTrial` to the success response
    return NextResponse.json({
      status: "success",
      data: result,
      source: "ai",
      usedPremiumTrial: canUseTrial && !isPaidSubscriber && !isAdminApproved,
      usage: {
        current: isNewNote ? notesUsed + 1 : notesUsed,
        limit: NOTE_LIMIT,
      },
    });
  } catch (error: any) {
    console.error("ROUTE_ERROR:", error);

    // ✅ FIX: Surface atomic quota race condition as a proper 403 instead of 500
    if (error.message === "QUOTA_EXHAUSTED") {
      return NextResponse.json(
        {
          error: "Note limit reached. Upgrade for more.",
          code: "LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}