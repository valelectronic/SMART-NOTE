import axios from "axios";

const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

export async function runOCRSpace(imageUrl: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY is missing");
  }

  try {
    // 1. Use FormData instead of params
    const formData = new FormData();
    formData.append("apikey", apiKey);
    formData.append("url", imageUrl);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("detectOrientation", "true");
    formData.append("scale", "true");
    formData.append("OCREngine", "1");
    formData.append("isTable", "true");

    // 2. Pass formData as the second argument (the body)
    const response = await axios.post(OCR_ENDPOINT, formData, {
      headers: {
        // Axios sets 'Content-Type': 'multipart/form-data' automatically with FormData
      },
      timeout: 30000,
    });

    const result = response.data;

    // OCR.Space sometimes returns a 200 OK but with an error message in the body
    if (result.IsErroredOnProcessing || result.OCRExitCode !== 1) {
      console.error("OCR.Space API Error:", result.ErrorMessage);
      throw new Error(result.ErrorMessage?.[0] || "OCR processing failed");
    }

    const parsedText =
      result.ParsedResults?.map((r: any) => r.ParsedText).join("\n") ?? "";

    if (!parsedText.trim()) {
      throw new Error("No OCR text detected");
    }

    return cleanOCRText(parsedText);
    
  } catch (error: any) {
    // 3. Better Error Logging
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      console.error("403 Forbidden: Check if your API Key is valid or if the URL is accessible.");
    }
    throw error;
  }
}

function cleanOCRText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}