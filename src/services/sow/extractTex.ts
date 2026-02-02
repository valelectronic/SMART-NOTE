import { createWorker } from "tesseract.js";
import { getCloudinaryImageUrl } from "@/lib/client";
import sharp from "sharp";
import axios from "axios";

export async function extractTextFromSOW(
  sowFileKey: string,
  onProgress?: (stage: string, percent: number) => void
) {
  const imageUrl = getCloudinaryImageUrl(sowFileKey);

  if (onProgress) onProgress("Enhancing Image Quality", 10);

  const worker = await createWorker("eng", 1, {
    logger: m => {
      if (!onProgress) return;

      if (m.status === "loading tesseract core") onProgress("Initializing Engine", 20);
      if (m.status === "loading language traineddata") onProgress("Loading Language Support", 30);
      if (m.status === "initializing api") onProgress("Preparing Reader", 40);
      if (m.status === "recognizing text") {
        const percent = 50 + Math.round(m.progress * 45);
        onProgress("Reading Document", percent);
      }
    },
    errorHandler: e => console.error("OCR Worker Error:", e),
  });

  try {
    // 1. Fetch image
    const imageResponse = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const imageBuffer = Buffer.from(imageResponse.data);

    // 2. Enhance image for OCR
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(3000)
      .grayscale()
      .normalize()
      .threshold(160)
      .sharpen({ sigma: 2 })
      .toBuffer();

    // 3. OCR
    const {
      data: { text },
    } = await worker.recognize(optimizedBuffer, { rotateAuto: true });

    await worker.terminate();

    if (!text || text.trim().length < 10) {
      throw new Error("Could not detect enough text in the image.");
    }

    if (onProgress) onProgress("Cleaning Text", 95);

    /**
     * 🔴 CRITICAL FIX:
     * Normalize OCR output WITHOUT inference
     */
    const cleanedText = text
      // Break table borders & bullets into lines
      .replace(/[|•■▪]/g, "\n")

      // Remove obvious OCR garbage lines
      .replace(/^[^\w\n]{1,}$/gm, "")

      // Remove stray single letters or symbols (K, I, l, etc.)
      .replace(/^\s*[A-Za-z]\s*$/gm, "")

      // Normalize multiple newlines
      .replace(/\n{2,}/g, "\n")

      // Trim each line
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length >= 3)
      .join("\n");

    if (cleanedText.length < 10) {
      throw new Error("OCR text is too noisy after cleaning.");
    }

    if (onProgress) onProgress("Complete", 100);

    //  DEBUG (keep for now)
    console.log("=== OCR CLEANED LINES ===");
    cleanedText.split("\n").forEach((l, i) => {
      console.log(`${i + 1}:`, l);
    });

    return {
      rawText: cleanedText,
      pageCount: 1,
    };
  } catch (error: any) {
    try {
      await worker.terminate();
    } catch {}
    throw new Error(error.message || "Failed to read the image.");
  }
}
