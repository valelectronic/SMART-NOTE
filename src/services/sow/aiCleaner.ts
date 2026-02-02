import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export interface WeekEntry {
  weekNumber: number;
  topicTitle: string;
  content: string;
}

export async function cleanOcrWithAI(rawText: string): Promise<WeekEntry[]> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.1, 
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting curriculum data from Nigerian school scheme of work documents for ANY subject.

Your task: Convert OCR text from ANY subject into clean, structured JSON format.

UNIVERSAL PARSING RULES (Works for ALL subjects):

1. WEEK IDENTIFICATION:
   - Look for lines with week numbers (1-13)
   - Common formats: "1:", "Week 1", "1.", "Wk 1", or just "1" followed by text
   - Skip special entries: "Midterm Examination", "Midterm Break", "Revision", "Examination", "Closing", "Holiday"

2. TOPIC EXTRACTION (Subject-Agnostic):
   - The topic is the MAIN CONCEPT or LESSON TITLE for that week
   - Topics can be:
     * Mathematics: "Fractions", "Algebra", "Geometry", "Quadratic Equations"
     * English: "Comprehension", "Essay Writing", "Grammar - Tenses", "Literature"
     * Science: "Photosynthesis", "The Human Body", "Chemical Reactions"
     * CRS/IRE: "The Beatitudes", "Prophets", "Ten Commandments", "Prayer"
     * Economics: "Demand and Supply", "Market Structures", "International Trade"
     * Any other subject...
   
   - STOP extracting topic when you see:
     * Descriptive words: "Meaning", "Definition", "Overview", "Introduction", "Explanation"
     * Activity words: "Activities", "Examples", "Exercises", "Evaluation", "Questions"
     * Detail words: "Features", "Types", "Importance", "Problems", "Causes", "Effects"
     * Connectors: "and" followed by lowercase, commas before lowercase

3. CONTENT EXTRACTION (Everything after the topic):
   - Content includes ALL details, subtopics, activities, and breakdowns
   - Common content patterns:
     * "Meaning and definition of [topic]"
     * "Types, features, importance and problems of [topic]"
     * "Activities: [list of activities]"
     * "Examples: [examples]"
     * "Subtopics: a) ... b) ... c) ..."
   
   - Merge fragmented OCR lines into coherent sentences
   - Fix common OCR errors:
     * Letter substitutions: "manutacturing" → "manufacturing", "discquihbnium" → "disequilibrium"
     * Missing spaces: "andthe" → "and the"
     * Extra spaces: "im portance" → "importance"

4. SPECIAL WEEKS (Universal across subjects):
   - "Midterm Examination" or "Mid-term Test" or "Test":
     * topicTitle: "Midterm Examination"
     * content: ""
   
   - "Midterm Break" or "Break" or "Holiday":
     * topicTitle: "Midterm Break"
     * content: ""
   
   - "Revision" or "Review":
     * topicTitle: "Revision"
     * content: "Review of term's work" (or extract specific revision topics if mentioned)
   
   - "Examination" or "Exam" or "Final Exam":
     * topicTitle: "Examination"
     * content: ""
   
   - "Closing" or "Closing Ceremony" or "Valedictory":
     * topicTitle: "Closing"
     * content: ""

5. HANDLING MESSY OCR (Common across all subjects):
   
   Example 1 - Merged topic and content:
   INPUT: "1 Fractions and Meaning. types of fractions, addition and subtraction of fractions"
   OUTPUT:
   {
     "topicTitle": "Fractions",
     "content": "Meaning, types of fractions, addition and subtraction of fractions"
   }
   
   Example 2 - Split across lines:
   INPUT: "2 The Beatitudes
           Meaning, the eight beatitudes,
           application to daily life"
   OUTPUT:
   {
     "topicTitle": "The Beatitudes",
     "content": "Meaning, the eight beatitudes, application to daily life"
   }
   
   Example 3 - Multiple subtopics:
   INPUT: "3 Photosynthesis Process, factors affecting photosynthesis, importance to plants and animals"
   OUTPUT:
   {
     "topicTitle": "Photosynthesis",
     "content": "Process, factors affecting photosynthesis, importance to plants and animals"
   }

6. CONTEXT AWARENESS:
   - Use surrounding text to identify the subject
   - If you see mathematical symbols (÷, ×, =, fractions), it's Mathematics
   - If you see biblical references (Acts, John, Genesis), it's CRS/IRE
   - If you see literary terms (poetry, prose, drama), it's English/Literature
   - Adjust topic extraction based on subject conventions

7. EMPTY WEEKS:
   - If no information exists for a week (week 13 is often empty), return empty strings
   - NEVER invent or hallucinate content

STRICT JSON OUTPUT FORMAT:
{
  "weeks": [
    {
      "weekNumber": 1,
      "topicTitle": "Topic Title Here",
      "content": "All details, subtopics, activities, and descriptions here"
    }
  ]
}

EXAMPLES ACROSS DIFFERENT SUBJECTS:

Mathematics:
INPUT: "1 Fractions and Meaning. types, addition, subtraction, multiplication of fractions"
OUTPUT: {"weekNumber": 1, "topicTitle": "Fractions", "content": "Meaning, types, addition, subtraction, multiplication of fractions"}

English:
INPUT: "2 Comprehension and Meaning, types of comprehension passages, answering techniques"
OUTPUT: {"weekNumber": 2, "topicTitle": "Comprehension", "content": "Meaning, types of comprehension passages, answering techniques"}

CRS:
INPUT: "3 The Ten Commandments Meaning, listing all ten commandments, application"
OUTPUT: {"weekNumber": 3, "topicTitle": "The Ten Commandments", "content": "Meaning, listing all ten commandments, application"}

Science:
INPUT: "4 The Human Digestive System Parts, functions, process of digestion"
OUTPUT: {"weekNumber": 4, "topicTitle": "The Human Digestive System", "content": "Parts, functions, process of digestion"}`.trim()
        },
        {
          role: "user",
          content: `Clean and structure this scheme of work OCR text. It can be from ANY subject (Math, English, Science, CRS, Economics, etc.). Extract exactly 13 weeks with proper topic and content separation:\n\n${rawText}`
        }
      ],
    });

    const content = response.choices[0]?.message?.content || '{"weeks":[]}';
    const parsed = JSON.parse(content);
    const aiWeeks = parsed.weeks || [];

    // Ensure we always return exactly 13 weeks
    return Array.from({ length: 13 }, (_, i) => {
      const target = i + 1;
      const found = aiWeeks.find((w: any) => Number(w.weekNumber) === target);
      return {
        weekNumber: target,
        topicTitle: found?.topicTitle?.trim() || "",
        content: found?.content?.trim() || "",
      };
    });
  } catch (error: any) {
    console.error("AI Error:", error.message);
    return Array.from({ length: 13 }, (_, i) => ({ 
      weekNumber: i + 1, 
      topicTitle: "", 
      content: "" 
    }));
  }
}

export async function validateIsScheme(rawText: string) {
  const hasWeek = /\b(week|wk|\d{1,2})\b/i.test(rawText);
  return hasWeek
    ? { isValid: true }
    : { isValid: false, reason: "No curriculum structure detected." };
}

/**
 * Extract weeks safely from cleaned OCR text
 * - Only detects numbers at start of line as weekNumber (1–13)
 * - Everything else goes to content
 * - topicTitle remains empty
 */
export function extractWeeks(cleanedText: string): WeekEntry[] {
  const lines = cleanedText
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const weeks: WeekEntry[] = [];
  let currentWeek: number | null = null;
  let collectedContent: string[] = [];

  for (const line of lines) {
    // Detect week number at start (1–13) but avoid false positives like "Acts 9:32" or "Part 2"
    const weekMatch = line.match(/^(\d{1,2})\b(?![\s]*[:.])/);

    if (weekMatch) {
      // Save previous week
      if (currentWeek !== null) {
        weeks.push({
          weekNumber: currentWeek,
          topicTitle: "", // always empty
          content: collectedContent.join(" ").trim(),
        });
      }

      currentWeek = Number(weekMatch[1]);
      collectedContent = [];

      // Remove week number, treat rest as content
      const rest = line.replace(/^(\d{1,2})\b/, "").trim();
      if (rest) collectedContent.push(rest);

      continue;
    }

    // Continuation lines → content only
    if (currentWeek !== null) {
      collectedContent.push(line);
    }
  }

  // Push last week
  if (currentWeek !== null) {
    weeks.push({
      weekNumber: currentWeek,
      topicTitle: "",
      content: collectedContent.join(" ").trim(),
    });
  }

  return weeks;
}

/**
 * Ensure UI always gets 13 weeks
 * - Missing weeks remain empty
 * - No AI involvement
 */
export function normalizeTo13Weeks(weeks: WeekEntry[]): WeekEntry[] {
  return Array.from({ length: 13 }, (_, i) => {
    const weekNumber = i + 1;
    const found = weeks.find(w => w.weekNumber === weekNumber);

    return found || {
      weekNumber,
      topicTitle: "",
      content: "",
    };
  });
}