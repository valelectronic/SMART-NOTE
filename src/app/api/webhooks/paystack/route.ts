import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // 1. SECURITY: Verify HMAC signature
    if (!signature) {
      return new Response("No signature provided", { status: 401 });
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.warn(" Invalid Webhook Signature detected");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);

    // 2. LOGIC: Handle Successful Charge
    if (event.event === "charge.success") {
      const userId = event.data.metadata?.userId;

      if (!userId) {
        console.error(" Payment received but userId missing in metadata");
        return NextResponse.json({ error: "Metadata missing" }, { status: 400 });
      }

      // Calculate 4 months (roughly 120 days) for a standard academic term
      const termExpiry = new Date();
      termExpiry.setMonth(termExpiry.getMonth() + 4);

      await db
        .update(onboarding)
        .set({
          subscriptionTier: "premium",
          // Resetting lastPaymentDate moves the 'usageCheckpoint' forward,
          // effectively resetting the 17-note counter in your generate API.
          lastPaymentDate: new Date(), 
          subscriptionExpiresAt: termExpiry,
          // If you have an approval process, ensure they are approved upon payment
          approvalStatus: "approved", 
        })
        .where(eq(onboarding.userId, userId));
      
      console.log(`User ${userId} successfully upgraded to Premium for the term.`);
    }

    // 3. ACKNOWLEDGE: Always return 200 to Paystack to stop retries
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (err) {
    console.error(" Webhook Error:", err);
    return new Response("Webhook Handlers Error", { status: 500 });
  }
}