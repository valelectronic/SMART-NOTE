import { getCloudinaryImageUrl } from "@/lib/client";
import { runOCRSpace, runOCRSpaceWithRetry } from "./ocrSpace";

export async function extractTextFromSOW(sowFileKey: string) {
  const imageUrl = getCloudinaryImageUrl(sowFileKey);
  
  console.log("=== STARTING SOW TEXT EXTRACTION ===");
  console.log("File Key:", sowFileKey);
  console.log("Image URL:", imageUrl);
  
  try {
    // ✅ Use retry version for better reliability
    const rawText = await runOCRSpaceWithRetry(imageUrl, 2);
    
    console.log("=== EXTRACTION SUCCESSFUL ===");
    console.log("Total characters extracted:", rawText.length);
    console.log("Preview:", rawText.substring(0, 200));
    
    // ✅ Final validation
    if (!rawText || rawText.trim().length === 0) {
      throw new Error(
        "OCR returned no text. Please ensure:\n" +
        "• The image is clear and well-lit\n" +
        "• Text is dark and readable\n" +
        "• The camera was focused\n" +
        "• There are no shadows on the paper"
      );
    }
    
    // ✅ Check for minimum viable content - VERY LENIENT
    const trimmed = rawText.trim();
    if (trimmed.length < 3) {
      throw new Error(
        `OCR extracted only ${trimmed.length} characters. This is too little.\n\n` +
        "What OCR found: \"" + trimmed + "\"\n\n" +
        "For handwritten schemes:\n" +
        "• Use dark pen (black or blue)\n" +
        "• Write clearly and legibly\n" +
        "• Ensure good lighting from above\n" +
        "• Hold the camera steady\n" +
        "• Make sure the text fills most of the frame\n\n" +
        "Try taking a clearer photo with better lighting."
      );
    }
    
    // ✅ Log what we actually got for debugging
    if (trimmed.length < 20) {
      console.warn(`⚠️ Very short extraction (${trimmed.length} chars): "${trimmed}"`);
    }
    
    return {
      rawText,
      pageCount: 1,
    };
    
  } catch (error) {
    console.error("=== EXTRACTION FAILED ===");
    console.error(error);
    
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(
      "Failed to extract text from the image. Please try:\n" +
      "• Taking a new photo in better lighting\n" +
      "• Using a darker pen for handwritten text\n" +
      "• Making sure the image is clear and focused"
    );
  }
}