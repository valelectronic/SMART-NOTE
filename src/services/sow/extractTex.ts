import { getCloudinaryImageUrl } from "@/lib/client";
import { runOCRSpace } from "./ocrSpace";

export async function extractTextFromSOW(sowFileKey: string) {
  const imageUrl = getCloudinaryImageUrl(sowFileKey);
  
  const rawText = await runOCRSpace(imageUrl);

  return {
    rawText,
    pageCount: 1, // single-page image
  };
}
