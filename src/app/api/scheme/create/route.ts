export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

import { createSchemeRecordController } from "@/controllers/SOW.controller";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json(); // This body now includes { sowFileKey, sowFileUrl, rawText }

    const headersList = await headers();
    const result = await createSchemeRecordController(body, headersList);

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    console.error("Scheme Create API Error:", error);
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 500 }
    );
  }
}