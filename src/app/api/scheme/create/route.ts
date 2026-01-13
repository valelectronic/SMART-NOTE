import { createSchemeRecordController } from "@/controllers/SOW.controller";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // ✅ READ JSON
    const body = await req.json();

    const result = await createSchemeRecordController(body);

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
