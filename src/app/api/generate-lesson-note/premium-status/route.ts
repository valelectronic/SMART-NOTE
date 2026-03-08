export const dynamic = "force-dynamic"; // Ensures no build-time caching
export const revalidate = 0;           // Ensures no background revalidation

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return NextResponse.json({ 
        isPremium: false, 
        subscriptionTier: "free" 
      }, { status: 401 });
    }

    const teacherProfile = await db.query.onboarding.findFirst({
      where: eq(onboarding.userId, session.user.id),
    });

    if (!teacherProfile) {
      return NextResponse.json({ 
        isPremium: false, 
        subscriptionTier: "free",
        message: "Onboarding incomplete" 
      }, { status: 200 });
    }

    //  MVP PREMIUM LOGIC
    // A user is premium if they have a paid tier OR were manually approved by you
    const isPaidSubscriber = ["premium", "school"].includes(teacherProfile.subscriptionTier || "");
    const isAdminApproved = teacherProfile.approvalStatus === "approved";
    
    const isPremium = isPaidSubscriber || isAdminApproved;

    return NextResponse.json({ 
      isPremium,
      subscriptionTier: teacherProfile.subscriptionTier || "free",
      approvalStatus: teacherProfile.approvalStatus,
      premiumTrialUsed: teacherProfile.premiumTrialUsed || false,
      // Useful for showing "Your subscription expires in X days"
      expiresAt: teacherProfile.subscriptionExpiresAt,
      userId: session.user.id, 
  userEmail: session.user.email
    }, { status: 200 });

  } catch (error) {
    console.error("PREMIUM_STATUS_ERROR:", error);
    return NextResponse.json({ isPremium: false }, { status: 500 });
  }
}