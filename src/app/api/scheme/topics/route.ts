import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schemeSubTopics, schemeWeeks, onboarding } from "@/lib/db/schema"; // Import onboarding
import { eq, asc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await db
      .select({
        weekId: schemeWeeks.id,
        weekNumber: schemeWeeks.weekNumber,
        term: schemeWeeks.term,
        subTopicId: schemeSubTopics.id,
        topicTitle: schemeSubTopics.topicTitle,
        topicContent: schemeSubTopics.topicContent,
        notesGenerated: schemeSubTopics.notesGenerated,
      })
      .from(schemeSubTopics)
      .leftJoin(schemeWeeks, eq(schemeSubTopics.schemeWeekId, schemeWeeks.id))
      // 🚀 JOIN onboarding to access the userId
      .leftJoin(onboarding, eq(schemeWeeks.onboardingId, onboarding.id))
      // 🚀 FILTER by the logged-in user's ID
      .where(eq(onboarding.userId, session.user.id)) 
      .orderBy(asc(schemeWeeks.weekNumber), asc(schemeSubTopics.createdAt));

    const grouped: Record<number, any> = {};
    
    for (const row of results) {
      // Use a fallback if weekNumber is null (though it shouldn't be)
      const weekNum = row.weekNumber ?? 1;

      if (!grouped[weekNum]) {
        grouped[weekNum] = { 
          weekNumber: weekNum, 
          term: row.term || "First Term",
          topics: [] 
        };
      }

      grouped[weekNum].topics.push({
        id: row.subTopicId,
        topicTitle: row.topicTitle,
        topicContent: row.topicContent,
        notesGenerated: row.notesGenerated,
        weekNumber: weekNum,
      });
    }

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("FETCH_SUBTOPICS_ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}