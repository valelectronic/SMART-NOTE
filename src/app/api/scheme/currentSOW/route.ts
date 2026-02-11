import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding, schemeWeeks, schemeSubTopics } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        // 1. AUTH CHECK
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. FETCH LATEST ONBOARDING RECORD
        const currentRecord = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, userId),
            orderBy: [desc(onboarding.updatedAt)], 
        });

        if (!currentRecord) {
            return NextResponse.json({ success: true, scheme: null });
        }

        // 3. FETCH THE ACTUAL STRUCTURED WEEKS AND TOPICS (The Missing Step)
        // We join the weeks and sub-topics to get a clean list for the editor
        const structuredWeeks = await db
            .select({
                weekNumber: schemeWeeks.weekNumber,
                topicTitle: schemeSubTopics.topicTitle,
                content: schemeSubTopics.topicContent, // Mapping topicContent to 'content' for the frontend
            })
            .from(schemeSubTopics)
            .innerJoin(schemeWeeks, eq(schemeSubTopics.schemeWeekId, schemeWeeks.id))
            .where(eq(schemeWeeks.onboardingId, currentRecord.id))
            .orderBy(asc(schemeWeeks.weekNumber));

        // 4. FORMAT RESPONSE
        // We now include the 'weeks' array which contains the real database rows
        const schemeData = {
            title: currentRecord.sowTitle,
            sowFileKey: currentRecord.sowFileKey,
            uploadedAt: currentRecord.sowUploadedAt?.toISOString(),
            processingStatus: currentRecord.sowProcessingStatus,
            sowErrorMessage: currentRecord.sowErrorMessage,
            sowEdited: currentRecord.sowEdited,
            updatedAt: currentRecord.updatedAt?.toISOString(),
            
            // This is what the Edit Page will loop over
            weeks: structuredWeeks, 
            
            // Fallback: If the relational tables are empty but the blob exists
            // we try to parse the blob so the user has something to see
            extractedText: structuredWeeks.length > 0 
                ? JSON.stringify(structuredWeeks) 
                : currentRecord.sowExtractedText,
                
            _internal_sync_id: Date.now() 
        };

        const response = NextResponse.json({ success: true, scheme: schemeData });
        
        // 5. AGGRESSIVE CACHE BUSTING
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;

    } catch (error: any) {
        console.error("[API ERROR]:", error);
        
        if (error.message?.includes("terminated") || error.message?.includes("Connection")) {
            return NextResponse.json(
                { success: false, error: "Database is busy. Retrying..." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to fetch data." },
            { status: 500 }
        );
    }
}