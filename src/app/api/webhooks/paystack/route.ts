import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { onboarding } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) return new Response("No signature", { status: 401 });

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error(" Missing PAYSTACK_SECRET_KEY in env variables");
      return new Response("Server config error", { status: 500 });
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.warn(" Signature mismatch. Check if your Secret Key is correct.");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const userId = event.data.metadata?.userId;
      
      console.log(`✅ Webhook received for User: ${userId}`);

      if (!userId) {
        console.error(" No userId in metadata");
        return NextResponse.json({ error: "No userId" }, { status: 400 });
      }

      const termExpiry = new Date();
      termExpiry.setMonth(termExpiry.getMonth() + 4);

      const result = await db
        .update(onboarding)
        .set({
          subscriptionTier: "premium",
          lastPaymentDate: new Date(), 
          subscriptionExpiresAt: termExpiry,
          approvalStatus: "approved", 
        })
        .where(eq(onboarding.userId, userId));
      
      console.log(`🚀 Database updated for ${userId}. Rows affected:`, result);
    }

    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (err) {
    console.error("💥 Webhook Crash:", err);
    return new Response("Internal Error", { status: 500 });
  }
}