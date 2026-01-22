import { NextResponse } from "next/server";
import { generateLessonNote } from "@/services/ai-service";

export async function GET() {
  try {
    // We send a tiny prompt just to see if the lights are on
    const testResult = await generateLessonNote("Say 'Connection Successful'");
    
    return NextResponse.json({
      status: "success",
      message: testResult.text,
      provider: testResult.provider
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      details: error.status === 429 ? "Rate limit hit" : "Check API keys"
    }, { status: 500 });
  }
}