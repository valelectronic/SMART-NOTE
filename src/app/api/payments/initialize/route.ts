// /api/paystack/initialize/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, amount, userId, planId } = await req.json();

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 300000, // Paystack uses kobo (Naira * 100)
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/verify`,
        metadata: {
          userId,
          planId,
          custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: userId }]
        },
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Initialization failed" }, { status: 500 });
  }
}