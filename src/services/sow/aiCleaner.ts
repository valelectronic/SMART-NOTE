import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function cleanOcrWithAI(rawText: string) {
  try {
    const response = await groq.chat.completions.create({
      // Use the updated Llama 3.1 model
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum assistant. 
          Today's date is January 2026. 
          Convert messy OCR text into a structured JSON array for a School Scheme of Work.
          1. Fix obvious OCR typos (e.g., 'bkt•works' -> 'Networks', 'browser5' -> 'browsers').
          2. Ensure the week numbers are sequential.
          3. Return ONLY a valid JSON object with a "weeks" key.
          Format: {"weeks": [{"weekNumber": number, "topicTitle": string, "content": string}]}
          Rules:
          - Fix spelling errors
          - Remove garbage words
          - Ignore revision/break rows
          - DO NOT invent topics
          - RETURN JSON ONLY (no markdown)`
        },
        {
          role: "user",
          content: rawText,
        },
      ],
      response_format: { type: "json_object" }, 
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    
    // Return the weeks array specifically
    return parsed.weeks || []; 
  } catch (error: any) {
    console.error("AI Cleanup Error:", error.message);
    throw error;
  }
}


/**
 * Checks if the text actually looks like a Scheme of Work.
 */
export async function validateIsScheme(rawText: string): Promise<{ isValid: boolean; reason?: string }> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a document classifier. 
          Analyze the text and determine if it is a school "Scheme of Work".
          A valid Scheme of Work must have:
          1. Sequential markers like "Week 1", "Wk 2", or "Week One".
          2. Educational topics or lesson titles.
          
          Return ONLY JSON: {"isValid": boolean, "reason": "Short explanation if false"}`
        },
        {
          role: "user",
          content: `Analyze this OCR text: ${rawText.substring(0, 1500)}` 
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"isValid": false}');
    return result;
  } catch (error) {
    // If AI fails, we default to true to avoid blocking the user due to API issues
    return { isValid: true };
  }
}