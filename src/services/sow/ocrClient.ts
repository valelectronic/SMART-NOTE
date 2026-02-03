import { createWorker, Worker } from "tesseract.js";

export async function extractTextFromSOWClient(
  file: File | Blob,
  onProgress?: (stage: string, percent: number) => void
): Promise<{ rawText: string }> {
  // Explicitly type the worker
  let worker: Worker | null = null;

  try {
    worker = await createWorker("eng", 1, {
      logger: m => {
        if (onProgress && m.status === "recognizing text") {
          onProgress("Reading Document", Math.round(m.progress * 100));
        }
      },
    });

    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();

    // The Cleaning Logic with typed parameters
    const cleanedText = text
      .replace(/[|•■▪]/g, "\n")
      .replace(/^[^\w\n]{1,}$/gm, "")
      .replace(/^\s*[A-Za-z]\s*$/gm, "")
      .replace(/\n{2,}/g, "\n")
      .split("\n")
      .map((line: string): string => line.trim()) // Explicitly string
      .filter((line: string): boolean => line.length >= 3) // Explicitly boolean
      .join("\n");

    return { rawText: cleanedText };
  } catch (error: any) {
    if (worker) await worker.terminate();
    throw new Error("OCR failed: " + (error.message || "Unknown error"));
  }
}