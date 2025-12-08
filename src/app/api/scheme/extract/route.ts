// app/api/scheme/extract/route.ts
import { uploadSchemeOfWorkController } from "@/controllers/SOW.controller";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const result = await uploadSchemeOfWorkController(formData);
    
    return Response.json(result, { status: result.success ? 200 : 400 });

  } catch (error: unknown) {
    console.error("Scheme Extract API Error:", error);

    // safely extract error message
    const message =
      error instanceof Error ? error.message : "Server error";

    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
