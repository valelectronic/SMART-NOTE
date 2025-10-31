// lib/cloudinary.ts


"use server"
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "not found") {
      return { success: true, message: "Image not found (already deleted)" };
    }

    return { success: true, result };
  } catch (err) {
    console.error("Error deleting from Cloudinary:", err);
    return { success: false, error: "Failed to delete image" };
  }
}
