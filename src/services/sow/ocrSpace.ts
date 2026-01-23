import axios from "axios";

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

export async function runOCRSpace(imageUrl: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY is missing");
  }

  try {
    console.log("=== OCR.space Processing ===");
    console.log("Image URL:", imageUrl);
    
    // 1. Use FormData
    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("url", imageUrl);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    
    // ✅ Keep Engine 1 for FREE tier (change to "2" when you upgrade)
    formData.append("OCREngine", "1"); // FREE - Engine 2 requires PRO plan
    
    formData.append("isTable", "true");
    
    // ✅ ADDITIONAL: Add filetype hint for better processing
    formData.append("filetype", "auto");

    const response = await axios.post(OCR_ENDPOINT, formData, {
      headers: {
        // Axios sets Content-Type automatically with FormData
      },
      timeout: 45000, // Increased timeout for handwritten text processing
    });

    const result = response.data;
    
    console.log("OCR.space Response:", JSON.stringify(result, null, 2));

    // Check for errors
    if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
      console.error("OCR.Space API Error:", result.ErrorMessage);
      const errorMsg = result.ErrorMessage?.[0] || "OCR processing failed";
      
      // ✅ Provide helpful error messages
      if (errorMsg.includes("Image size")) {
        throw new Error("Image is too large or too small. Please use a clear, medium-sized photo.");
      } else if (errorMsg.includes("rate limit")) {
        throw new Error("Too many requests. Please try again in a moment.");
      } else {
        throw new Error(`OCR Error: ${errorMsg}`);
      }
    }

    // Extract text from all pages
    const parsedText =
      result.ParsedResults?.map((r: any) => r.ParsedText).join("\n") ?? "";

    console.log("=== OCR Extraction Complete ===");
    console.log(`Raw length: ${parsedText.length} characters`);
    console.log("RAW TEXT START ---");
    console.log(parsedText); // Log FULL text for debugging
    console.log("--- RAW TEXT END");

    if (!parsedText.trim()) {
      throw new Error("OCR could not detect any text in the image. Please ensure:\n• The image is clear and well-lit\n• Text is visible and readable\n• The camera was focused properly");
    }

    const cleaned = cleanOCRText(parsedText);
    console.log(`Cleaned length: ${cleaned.length} characters`);
    console.log("CLEANED TEXT START ---");
    console.log(cleaned); // Log cleaned text too
    console.log("--- CLEANED TEXT END");
    
    return cleaned;
    
  } catch (error: any) {
    console.error("=== OCR Error ===", error);
    
    // Better Error Logging
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        throw new Error("Invalid API key. Please check your OCR.space API key configuration.");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a few moments.");
      } else if (error.code === 'ECONNABORTED') {
        throw new Error("OCR processing took too long. Please try with a clearer or smaller image.");
      }
    }
    
    throw error;
  }
}

function cleanOCRText(text: string) {
  console.log("=== Cleaning OCR Text ===");
  console.log("Before cleaning:", text.length, "characters");
  
  const cleaned = text
    // Remove carriage returns
    .replace(/\r/g, "")
    // Normalize multiple spaces to single space
    .replace(/[ \t]{2,}/g, " ")
    // Normalize multiple newlines (max 2)
    .replace(/\n{3,}/g, "\n\n")
    // ✅ Remove common OCR artifacts
    .replace(/[|]/g, "I") // Pipe to I
    .replace(/[`'']/g, "'") // Normalize quotes
    // Trim the whole text
    .trim();
  
  console.log("After initial cleaning:", cleaned.length, "characters");
  
  // ✅ CRITICAL: Don't filter out short lines for handwritten text
  // Just trim each line but keep everything
  const finalCleaned = cleaned
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    .trim();
  
  console.log("After final cleaning:", finalCleaned.length, "characters");
  
  return finalCleaned;
}

// ✅ OPTIONAL: Add retry mechanism for unreliable networks
export async function runOCRSpaceWithRetry(
  imageUrl: string, 
  maxRetries = 2
): Promise<string> {
  let lastError: Error;
  let bestResult = "";
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`OCR Attempt ${attempt}/${maxRetries}`);
      const result = await runOCRSpace(imageUrl);
      
      // ✅ FIXED: More lenient validation - keep best result
      console.log(`Attempt ${attempt} extracted: ${result.trim().length} characters`);
      
      // Keep the longest result
      if (result.trim().length > bestResult.length) {
        bestResult = result.trim();
      }
      
      // If we got something reasonable, return it
      if (result.trim().length >= 5) {
        return result;
      }
      
      // If very short, try again
      throw new Error(`OCR extracted only ${result.trim().length} characters - retrying...`);
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (
        error instanceof Error && 
        (error.message.includes("API key") || 
         error.message.includes("403"))
      ) {
        throw error; // Don't retry auth errors
      }
      
      if (attempt < maxRetries) {
        console.log(`Waiting before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      }
    }
  }
  
  // ✅ If we got ANYTHING across all retries, use it
  if (bestResult.length > 0) {
    console.log(`⚠️ Returning best result from retries: ${bestResult.length} characters`);
    console.log("Content:", bestResult);
    return bestResult;
  }
  
  throw lastError!;
}