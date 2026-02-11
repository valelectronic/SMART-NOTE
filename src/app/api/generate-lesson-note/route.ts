import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboarding, schemeSubTopics, lessonNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateLessonNote, refineLessonNote } from "@/services/ai-service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { fa } from "zod/v4/locales";

const requestSchema = z.object({
  subTopicId: z.string().uuid(),
  instruction: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate User
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { subTopicId, instruction } = requestSchema.parse(body);

    // 2. Fetch Context & Existing Note
    const [teacherProfile, topicData, existingNote] = await Promise.all([
      db.query.onboarding.findFirst({ where: eq(onboarding.userId, session.user.id) }),
      db.query.schemeSubTopics.findFirst({ where: eq(schemeSubTopics.id, subTopicId) }),
      db.query.lessonNotes.findFirst({ where: eq(lessonNotes.schemeSubTopicId, subTopicId) }),
    ]);

    if (!teacherProfile || !topicData) {
      return NextResponse.json({ error: "Context missing" }, { status: 404 });
    }

    //  TEST MODE TOGGLE
    // Set to true to use Claude 3.7 (Premium) | false to use Groq (Free)
    const isPremium = false; // Change to true to test with Claude 3.7 and see the difference in output quality and cost.

    // 3. AI Execution
    let aiResponse: any;
    const startTime = Date.now();

    if (existingNote && instruction) {
      // Refinement Path (Correction)
      aiResponse = await refineLessonNote(existingNote.content, instruction);
    } else {
      // Initial Generation Path
      aiResponse = await generateLessonNote({
        subject: teacherProfile.subjectTaught,
        class: teacherProfile.teachingLevel,
        topic: topicData.topicTitle,
        term: "First Term", 
        week: 1, 
      }, isPremium);
    }

    // 4. Type Narrowing & Failure Check
    if (!aiResponse || !aiResponse.text) {
      throw new Error("The AI failed to generate a response. Please check your API keys.");
    }

    const contentText: string = aiResponse.text;
    const aiProvider: string = aiResponse.provider;
    const duration = Math.floor((Date.now() - startTime) / 1000);

        // 💰 5. UPDATED COST AUDIT LOGGING
      console.log(`\n--- 📊 AI GENERATION AUDIT ---`);
      console.log(`Model Provider: ${aiProvider}`);
      console.log(`Generation Time: ${duration}s`);

      if (aiResponse.usage) {
        const { promptTokens, completionTokens, estimatedCost } = aiResponse.usage;

        // Use the estimatedCost from the service if available, otherwise fallback to a calculation
        const displayCost = estimatedCost ?? (
          aiProvider.includes("anthropic") 
            ? (promptTokens * 0.000001) + (completionTokens * 0.000005) // Haiku 4.5 rates
            : (promptTokens * 0.0000006) + (completionTokens * 0.0000006) // Groq rates
        );

        console.log(`Tokens used: ${promptTokens} (prompt) / ${completionTokens} (completion)`);
        console.log(`Estimated Cost: $${displayCost.toFixed(4)}`);
      } else {
        console.log(`Usage data: Not provided`);
      }
      console.log(`-------------------------------\n`);
          // 6. Subject-Topic Mismatch Check
    if (contentText.includes("⚠️ Subject–Topic Mismatch")) {
        return NextResponse.json({ error: contentText }, { status: 400 });
    }

    // 7. Database Transaction
    const result = await db.transaction(async (tx) => {
      const metadata = {
        editCount: existingNote ? existingNote.editCount + 1 : 0,
        lastCorrectionInstruction: instruction || null,
        lastGeneratedAt: new Date(),
        aiModelUsed: aiProvider,
        generationTime: duration,
        wordCount: contentText.split(/\s+/).length,
      };

      let finalNote;
      if (existingNote) {
        // Update existing record
        [finalNote] = await tx.update(lessonNotes)
          .set({
            content: contentText,
            ...metadata
          })
          .where(eq(lessonNotes.id, existingNote.id))
          .returning();
      } else {
        // Create new record
        [finalNote] = await tx.insert(lessonNotes).values({
          userId: session.user.id,
          onboardingId: teacherProfile.id,
          schemeSubTopicId: topicData.id,
          title: topicData.topicTitle,
          subject: teacherProfile.subjectTaught,
          topic: topicData.topicTitle,
          gradeLevel: teacherProfile.teachingLevel,
          curriculum: teacherProfile.curriculumStandard,
          formatUsed: teacherProfile.preferredNoteFormat || "Standard",
          content: contentText,
          originalContent: contentText,
          ...metadata,
        }).returning();

        // Mark the sub-topic as "done" in the scheme
        await tx.update(schemeSubTopics)
          .set({ notesGenerated: true })
          .where(eq(schemeSubTopics.id, subTopicId));
      }
      return finalNote;
    });

    return NextResponse.json({ status: "success", data: result });

  } catch (error: any) {
    console.error("ROUTE_ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}