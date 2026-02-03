import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        // 1. AUTH CHECK (Moved inside try-catch to handle DB connection issues)
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. FETCH LATEST RECORD
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
        let schemeData = null;
        if (currentScheme) {
            schemeData = {
                title: currentScheme.sowTitle,
                sowFileKey: currentScheme.sowFileKey,
                uploadedAt: currentScheme.sowUploadedAt?.toISOString(),
                processingStatus: currentScheme.sowProcessingStatus,
                sowErrorMessage: currentScheme.sowErrorMessage,
                sowEdited: currentScheme.sowEdited,
                updatedAt: currentScheme.updatedAt?.toISOString(),
                sowExtractedText: currentScheme.sowExtractedText,
                extractedText: currentScheme.sowExtractedText,
                _internal_sync_id: Date.now() 
            };
        }

        const response = NextResponse.json({ success: true, scheme: schemeData });
        
        // 4. AGGRESSIVE CACHE BUSTING
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;

    } catch (error: any) {
        console.error("[API ERROR]:", error);
        
        // ✅ Specific check for the "Connection terminated" error
        if (error.message?.includes("terminated") || error.message?.includes("Connection")) {
            return NextResponse.json(
                { success: false, error: "Database is busy. Retrying..." },
                { status: 503 } // 503 Service Unavailable is better for timeouts
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to fetch data." },
            { status: 500 }
        );
    }
}