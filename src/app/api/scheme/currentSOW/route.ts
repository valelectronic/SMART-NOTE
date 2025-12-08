// src/app/api/scheme/current-sow/route.ts

import { auth } from "@/lib/auth"; // Your authentication utility
import { headers } from "next/headers";
import { db } from "@/lib/db"; // Your Drizzle DB connection
import { onboarding } from "@/lib/db/schema"; // Your Drizzle schema for 'onboarding'
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
    // 1. AUTH CHECK
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // 2. FETCH CURRENT SOW RECORD
        const currentScheme = await db.query.onboarding.findFirst({
            where: eq(onboarding.userId, userId),
            columns: {
                sowFileKey: true,
                sowTitle: true,
                sowUploadedAt: true,
            }
        });

        // 3. FORMAT RESPONSE
        if (currentScheme && currentScheme.sowFileKey) {
            const schemeData = {
                title: currentScheme.sowTitle,
                sowFileKey: currentScheme.sowFileKey,
                uploadedAt: currentScheme.sowUploadedAt?.toISOString(),
            };

            return NextResponse.json({ success: true, scheme: schemeData });
        }

        // Return null if no scheme is found
        return NextResponse.json({ success: true, scheme: null });

    } catch (error) {
        console.error("[API ERROR] Failed to fetch current SOW:", error);
        return NextResponse.json(
            { success: false, error: "Database error fetching scheme data." },
            { status: 500 }
        );
    }
}