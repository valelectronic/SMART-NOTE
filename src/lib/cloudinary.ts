"use server";

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


//  ADD THIS DEBUG BLOCK 
const CLOUD_SECRET_PREFIX = process.env.CLOUDINARY_API_SECRET?.substring(0, 4) || "MISSING";
console.log(`[DEBUG] Cloudinary Secret Status (Prefix): ${CLOUD_SECRET_PREFIX}`);


export async function deleteFromCloudinary(publicId: string) {
  const resourceTypes = ["image", "raw", "video", ];

  for (const type of resourceTypes) {
    console.log(`[Cloudinary] Trying delete -> ${publicId} (resource_type: ${type})`);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
      type: "upload",
    });

    console.log(`[Cloudinary] Result (${type}):`, result);

    // File deleted successfully
    if (result.result === "ok") {
      return { success: true, typeUsed: type, result };
    }

    // Continue trying others if "not found"
    if (result.result === "not found") {
      continue;
    }
  }

  return { success: false, error: "Asset not found or deletion failed" };
}

