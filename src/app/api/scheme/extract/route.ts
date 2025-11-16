// app/api/scheme/extract/route.ts
import { uploadSchemeOfWorkController } from "@/controllers/SOW.controller";

export async function POST(req: Request) {
  try {
    // Get FormData from request
    const formData = await req.formData();

    // Call your controller logic
    const result = await uploadSchemeOfWorkController(formData);

    // Return result to client
    return Response.json(result, { status: result.success ? 200 : 400 });

  } catch (error: any) {
    console.error("Scheme Extract API Error:", error);
    return Response.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
