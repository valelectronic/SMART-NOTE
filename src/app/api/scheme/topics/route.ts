import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schemeSubTopics, schemeWeeks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // LEFT JOIN ensures we get topics even if the week link is broken
    const results = await db
      .select({
        id: schemeSubTopics.id,
        topicTitle: schemeSubTopics.topicTitle,
        weekNumber: schemeWeeks.weekNumber,
      })
      .from(schemeSubTopics)
      .leftJoin(schemeWeeks, eq(schemeSubTopics.schemeWeekId, schemeWeeks.id))
      .orderBy(asc(schemeWeeks.weekNumber));

    if (results.length === 0) {
       console.log("DB returned 0 rows for user:", session.user.id);
    }

    const grouped = results.reduce((acc: any, row) => {
      // Default to Week 1 if the weekNumber is null
      const weekNum = row.weekNumber || 1; 
      if (!acc[weekNum]) {
        acc[weekNum] = { weekNumber: weekNum, topics: [] };
      }
      acc[weekNum].topics.push(row);
      return acc;
    }, {});

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}