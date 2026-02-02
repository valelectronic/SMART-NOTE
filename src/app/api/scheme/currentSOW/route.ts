import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm"; // Added desc
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    // 1. AUTH CHECK
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 2. FETCH LATEST RECORD (Added Sorting)
        const currentScheme = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, userId),
            orderBy: [desc(onboarding.updatedAt)], 
            columns: {
                sowFileKey: true,
                sowTitle: true,
                sowUploadedAt: true,
                sowProcessingStatus: true,
                sowErrorMessage: true,
                sowExtractedText: true,
                sowEdited: true,
                updatedAt: true,
            }
        });

        // 3. FORMAT RESPONSE
        if (currentScheme) {
            const schemeData = {
                title: currentScheme.sowTitle,
                sowFileKey: currentScheme.sowFileKey,
                uploadedAt: currentScheme.sowUploadedAt?.toISOString(),
                processingStatus: currentScheme.sowProcessingStatus,
                sowErrorMessage: currentScheme.sowErrorMessage,
                sowEdited: currentScheme.sowEdited,
                updatedAt: currentScheme.updatedAt?.toISOString(),
                sowExtractedText: currentScheme.sowExtractedText,
                extractedText: currentScheme.sowExtractedText,
                // Force a unique hash so the frontend state always updates
                _internal_sync_id: Date.now() 
            };

            const response = NextResponse.json({ success: true, scheme: schemeData });
            
            // 4. AGGRESSIVE CACHE BUSTING HEADERS
            response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            response.headers.set('Pragma', 'no-cache');
            response.headers.set('Expires', '0');
            response.headers.set('Surrogate-Control', 'no-store');
            
            return response;
        }

        return NextResponse.json({ success: true, scheme: null }, {
            headers: { 'Cache-Control': 'no-store' }
        });

    } catch (error) {
        console.error("[API ERROR]:", error);
        return NextResponse.json(
            { success: false, error: "Database error." },
            { status: 500 }
        );
    }
}