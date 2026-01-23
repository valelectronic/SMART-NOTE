import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function cleanOcrWithAI(rawText: string) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", 
      messages: [
        {
          role: "system",
          content: `You are an expert curriculum assistant specializing in reading messy OCR from handwritten and printed Scheme of Work documents.
          Today's date is January 2026.
          
          Your task:
          1. Extract ALL week entries, even if partially readable
          2. Fix OCR errors aggressively (e.g., 'bkt•works' -> 'Networks', 'W33k' -> 'Week', '1nt0' -> 'Into')
          3. Interpret common handwriting OCR errors (0->O, 1->I, 5->S, etc.)
          4. If you see numbers like "1.", "2.", "3." they likely represent weeks
          5. Ensure sequential week numbering
          6. BE LENIENT - extract even if uncertain
          
          Return ONLY valid JSON: {"weeks": [{"weekNumber": number, "topicTitle": string, "content": string}]}
          
          Rules:
          - Fix spelling errors aggressively
          - Remove garbage characters (#@$%^&*)
          - Skip revision/break/exam weeks ONLY if explicitly stated
          - Fill missing content with empty string ""
          - If topicTitle is unclear, use "Topic [Week Number]"
          - ALWAYS return at least 1 week if ANY text exists
          - DO NOT return empty array unless rawText is completely unreadable
          - RETURN JSON ONLY (no markdown, no explanation)`
        },
        {
          role: "user",
          content: `Extract scheme weeks from this OCR text (may be handwritten):\n\n${rawText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent parsing
    });

    const content = response.choices[0]?.message?.content || "{}";
    console.log("AI Response:", content);
    
    const parsed = JSON.parse(content);
    
    // Validate the structure
    if (!parsed.weeks || !Array.isArray(parsed.weeks)) {
      console.error("Invalid AI response structure:", parsed);
      return [];
    }
    
    // Filter out completely empty entries
    const validWeeks = parsed.weeks.filter((week: any) => 
      week.weekNumber && (week.topicTitle || week.content)
    );
    
    console.log(`Extracted ${validWeeks.length} valid weeks from AI`);
    return validWeeks;
    
  } catch (error: any) {
    console.error("AI Cleanup Error:", error.message);
    
    // ✅ FALLBACK: Try basic pattern matching if AI fails
    console.log("Attempting fallback extraction...");
    return fallbackExtraction(rawText);
  }
}

/**
 * Fallback extraction using regex patterns when AI fails
 */
function fallbackExtraction(text: string): Array<{weekNumber: number, topicTitle: string, content: string}> {
  const weeks = [];
  
  // Try to find week patterns
  const weekPatterns = [
    /week\s*(\d+)[:\s-]*([^\n]+)/gi,
    /wk\.?\s*(\d+)[:\s-]*([^\n]+)/gi,
    /(\d+)\.\s*([^\n]+)/g, // Numbered lists
  ];
  
  for (const pattern of weekPatterns) {
    const matches = [...text.matchAll(pattern)];
    
    for (const match of matches) {
      const weekNum = parseInt(match[1]);
      const topic = match[2]?.trim() || "";
      
      if (weekNum > 0 && weekNum <= 52 && topic.length > 2) {
        weeks.push({
          weekNumber: weekNum,
          topicTitle: topic,
          content: "",
        });
      }
    }
    
    if (weeks.length > 0) break; // Stop if we found something
  }
  
  console.log(`Fallback extracted ${weeks.length} weeks`);
  return weeks;
}

/**
 * Validates if text looks like a Scheme of Work
 * ✅ IMPROVED: More lenient for handwritten text
 */
export async function validateIsScheme(rawText: string): Promise<{ isValid: boolean; reason?: string }> {
  try {
    // ✅ Quick pre-check: Does it have ANY week-like patterns?
    const hasWeekPattern = /week|wk|w\d+|\d+\./i.test(rawText);
    
    if (!hasWeekPattern) {
      return {
        isValid: false,
        reason: "No week numbers found. Please ensure your scheme shows 'Week 1', 'Week 2', etc."
      };
    }
    
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a lenient document classifier for school Scheme of Work documents.
          
          A document is valid if it has:
          1. ANY indication of weeks (Week 1, Wk 2, W3, or even just "1.", "2.", "3.")
          2. Something that could be educational topics
          
          Be VERY LENIENT - even messy handwritten OCR counts as valid if it shows weekly structure.
          
          Return ONLY JSON: {"isValid": boolean, "reason": "explanation if false"}
          
          Examples of VALID schemes:
          - "Week 1: Introduction to Biology"
          - "1. Photosynthesis 2. Cell division"
          - "Wk1-Plant parts Wk2-Animal parts"
          - Even very messy OCR with week numbers
          
          Only mark as INVALID if:
          - Completely unrelated to education (shopping list, personal notes)
          - No week/number structure at all
          - Just random text with no organization`
        },
        {
          role: "user",
          content: `Is this a Scheme of Work? (may be handwritten with OCR errors):\n\n${rawText.substring(0, 1500)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Very low temperature for consistent validation
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"isValid": false}');
    console.log("Validation result:", result);
    return result;
    
  } catch (error) {
    console.error("Validation error:", error);
    // ✅ If AI validation fails, default to true for handwritten schemes
    return { isValid: true };
  }
}