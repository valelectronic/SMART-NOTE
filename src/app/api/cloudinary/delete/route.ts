import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { publicId } = body;

    if (!publicId) {
      return new Response(JSON.stringify({ error: "publicId is required" }), { status: 400 });
    }

    const result = await deleteFromCloudinary(publicId);

    return new Response(JSON.stringify(result), { status: result.success ? 200 : 500 });
  } catch (err) {
    console.error("[Cloudinary Delete] Error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), { status: 500 });
  }
}
