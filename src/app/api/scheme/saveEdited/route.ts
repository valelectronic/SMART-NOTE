import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding, schemeWeeks, schemeSubTopics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { weeks } = await req.json();
    const userId = session.user.id;

    console.log("=== MANUAL SAVE REQUEST ===");
    console.log(`User: ${userId}`);
    console.log(`Weeks to save: ${weeks?.length}`);

    if (!weeks || !Array.isArray(weeks)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // 1. Find the onboarding record
      const record = await tx.query.onboarding.findFirst({
        where: eq(onboarding.userId, userId),
      });

      if (!record) {
        throw new Error("Onboarding record not found");
      }

      

      // 2. Delete old scheme data
      await tx.delete(schemeWeeks).where(eq(schemeWeeks.onboardingId, record.id));
   

      // 3. Insert new structured rows
      for (const item of weeks) {
        const [insertedWeek] = await tx.insert(schemeWeeks).values({
          onboardingId: record.id,
          weekNumber: isNaN(parseInt(item.weekNumber)) ? 0 : parseInt(item.weekNumber),
          term: "First Term",
        }).returning();

        await tx.insert(schemeSubTopics).values({
          schemeWeekId: insertedWeek.id,
          topicTitle: item.topicTitle || 'Untitled Topic',
          topicContent: item.content || '',
          extractedFrom: "manual_edit",
        });
      }

   
      // 4. CRITICAL: Update sowExtractedText (THIS IS WHAT WAS MISSING!)
      await tx.update(onboarding)
        .set({
          sowEdited: true,
          sowExtractedText: JSON.stringify(weeks), 
          updatedAt: new Date(),
        })
        .where(eq(onboarding.id, record.id));


      return { success: true };
    });

    return NextResponse.json(result);
    
  } catch (error) {
    console.error("[SAVE_EDITED_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Failed to save scheme" },
      { status: 500 }
    );
  }
}