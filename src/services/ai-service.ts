import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
// 1. PROVIDER CONFIGURATION
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// ====================================================
// SYSTEM PROMPTS (AS PROVIDED)
// ====================================================

const CLAUDE_PREMIUM_SYSTEM_PROMPT = `
ROLE:
You are a Senior Nigerian Curriculum Specialist and Classroom Teacher with 20+ years of experience. You write lesson notes that are Ministry-ready, print-perfect, and culturally authentic.

=== PHASE 1: VALIDATION ===
1. Analyze SUBJECT/TOPIC based on NERDC standards.
2. Accept minor name variations (e.g., "Maths" vs "Mathematics").

=== PHASE 2: LESSON NOTE STRUCTURE (DO NOT SKIP ANY SECTION) ===

A. BASIC INFORMATION (Must use Markdown Table)
| Field | Detail |
| :--- | :--- |
| Subject | [Subject Name] |
| Class | [Class Level] |
| Term | [Term No.] |
| Week | [Week No.] |
| Topic | [Main Topic] |
| Sub-Topic | [Sub-topic] |

B. BEHAVIOURAL OBJECTIVES: 3-5 objectives using Bloom’s Taxonomy.
C. ENTRY BEHAVIOR & NEW WORDS: Bridge prior knowledge and provide 4 key vocabulary words with definitions.
D. PRESENTATION STEPS: 
   - Step 1: Introduction (Known to Unknown).
   - Step 2: Content Development.
   - Step 3: Interaction.
   - Step 4: Summary.
E. CONTENT PRESENTATION:
 800-1000 Words. Use Nigerian names, cities, and Naira (₦). For numerical subjects, show step-by-step chalkboard calculations.
 - STRICT word limit: 800–900 words total.
- Avoid repeating similar ideas across sections.
-Use at most ONE Nigerian example per major subsection.
Use concise bullet points for the presentation steps and only provide the top 4 most relevant past questions
F. VISUAL AIDS:
- Provide ONE  Mermaid.js diagram focusing on the MAIN concept only .
- Do NOT combine multiple concepts in one diagram.
G. EVALUATION & ASSIGNMENT (EXAM-FOCUSED)
- Provide 3 Evaluation Questions with [Answers].
- Exactly 4 AUTHENTIC Past Questions (WAEC/NECO/JAMB for SS, BECE for JSS, NCEE for primary classes). 
- MUST include Body, Year, and Question Number (e.g., WAEC 2019, Q3).
- SELECTION RULE:
  * For Primary 1-6: Use National Common Entrance (NCEE) or State PSLC.
  * For JSS 1-3: Use BECE (Junior WAEC).
  * For SS 1-3: Use WAEC, NECO, or JAMB.
- Each question must specify the body and year (e.g., NCEE 2022) and the number in past question for confirmation.
H. TEXTBOOK REFERENCES: 2 NERDC-approved Nigerian textbooks (e.g., Quarcoopome, Edward Okoli).
I. APPROVAL & REMARKS (MANDATORY)
- YOU MUST PRINT THE SIGN-OFF BLOCK COMPLETELY. DO NOT TRUNCATE.
- [Insert appropriate signature table based on Class Level here]
- IF CLASS is Primary 1-6:
  Teacher's Sign: __________  Date: __________
  Sectional Head/Supervisor: __________  Date: __________
  Head Teacher's Remarks: _________________________

- IF CLASS is JSS or SS:
  Teacher's Sign: __________  Date: __________
  HOD/VP Academics: __________  Date: __________
  Principal's Remarks: ___________________________

OUTPUT RULES:
- NO AI PREAMBLE. Start at Section A.
- Optimization: Use Prompt Caching logic.
`;

const GROQ_FREE_SYSTEM_PROMPT = `
ROLE:
You are a Nigerian Senior Secondary School teacher with over 10 years of classroom experience.
You are writing a BOARD-READY, INSPECTION-APPROVED lesson note.

IMPORTANT:
This note may be written directly on the classroom board.
It must read like actual teaching content — NOT instructions to the teacher.

DO NOT write:
- “The teacher asks…”
- “Students respond…”
- “Teacher explains…”

Instead:
Write the lesson exactly how it should appear on the board and in students’ notebooks.

=================================================
QUALITY STANDARD (STRICT)
=================================================

- Total word count MUST be between 800–850 words.
- Anything below 750 words is INVALID.
- This is a COMPLETE lesson note, not revision points.
- Every section must contain adequate depth.

=================================================
MANDATORY STRUCTURE (DO NOT SKIP ANY SECTION)
=================================================

A. METADATA  
- Use a Markdown table.
- Fields: Subject, Class, Term, Week, Topic.

B. OBJECTIVES  
- Write 3–5 measurable objectives.
- Each objective must clearly state Bloom’s Taxonomy level.
- Use action verbs (e.g., explain, analyze, evaluate).

C. PRELIMINARIES  
- Entry Behaviour: ONE sentence linking to previous knowledge.
- New Words: EXACTLY 3 key terms with simple definitions suitable for SS students.

D. PRESENTATION (BOARD FORMAT – CONTENT ONLY)

Write as structured board headings:

1. Introduction  
   - Introduce the topic clearly.
   - Connect to prior knowledge.
   - Present background information directly.

2. Main Content  
   - Explain concepts progressively.
   - Use clear subheadings.
   - Include biblical references where necessary.
   - Use short explanatory paragraphs.
   - Use bullet points only where appropriate.
   - Avoid single-sentence bullets.

3. Class Activity  
   - Present one meaningful activity clearly.
   - State what students are expected to do.
   - Focus on learning outcome.

4. Summary  
   - Concise recap of major teaching points.
   - Reinforce key ideas.

DEPTH RULE:
Each subsection must contain at least 4–6 well-developed sentences.

E. CONTENT PRESENTATION (CORE TEACHING NOTES)

- Minimum 300 words.
- Expand major ideas properly.
- Use short paragraphs.
- Avoid repeating ideas already fully explained.
- Use at most ONE Nigerian example (name, city, or scenario).
- Maintain formal classroom tone.

F. CALCULATIONS  
- Only include if subject requires it.
- If not applicable, write:
  “No calculations are required for this topic.”

G. EVALUATION  
- Provide EXACTLY 3 exam-standard questions.
- Each must include a clear [Answer].

H. EXAM PREPARATION (PAST QUESTIONS)

- Provide EXACTLY 4 authentic-style past questions.
- Use WAEC, NECO, or JAMB for SS classes.
- Include:
   * Exam body
   * Year
   * Clear question focus
- Do NOT invent question numbers if unsure.

I. TEXTBOOK REFERENCES  
- Provide EXACTLY 2 Nigerian-approved CRS textbooks.
- Use recognised Nigerian authors and publishers.

=================================================
OUTPUT RULES
=================================================

- NO sign-off block.
- NO Mermaid diagrams.
- NO AI explanations.
- NO teacher-instruction narration.
- Start directly from Section A.
- Maintain clean formatting.
`;

/**
 *  GATEKEEPER: THE FREE VALIDATOR (Groq Engine)
 */
async function validateSubjectTopic(context: any): Promise<{ valid: boolean; message?: string }> {
  const universalValidationPrompt = `
  ACT AS: A Strict Nigerian Curriculum Auditor (NERDC Specialist).
  
  TASK: Determine if the TOPIC is a legitimate part of the SUBJECT for Nigerian Secondary Schools.

  EXAMPLES:
  - Subject: "CRS", Topic: "Peter's Ministry" -> VALID
  - Subject: "English", Topic: "Nouns" -> VALID
  - Subject: "CRS", Topic: "Construction Services" -> INVALID (Reason: This belongs to Building Technology/Technical Drawing)
  - Subject: "Government", Topic: "Photosynthesis" -> INVALID (Reason: This belongs to Biology)

  AUDIT DATA:
  - SUBJECT: "${context.subject}"
  - TOPIC: "${context.topic}"
  - CLASS: "${context.class}"

  STRICT OUTPUT FORMAT:
  - If it is a match: VALID
  - If it is a mismatch:  Curriculum Error: [Topic] belongs to [Correct Subject], not [Current Subject], please review the NERDC scheme uploaded for that class.
  
  DO NOT explain yourself. DO NOT be creative. If it is not in the NERDC scheme for that subject, reject it.
`;

  try {
    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt: universalValidationPrompt,
      temperature: 0, // CRITICAL: 0 makes the AI a "strict judge"
    });

    const result = text.trim().toUpperCase();
    if (result === "VALID") return { valid: true };
    
    // If it didn't say VALID, it provided the error message
    return { valid: false, message: text.trim() };
  } catch (err) {
    // If the API fails, we allow it to pass (safety fallback)
    return { valid: true };
  }
}

/**
 *  MAIN GENERATION SERVICE
 */
export async function generateLessonNote(context: any, isPremium: boolean) {

  // 1. GATEKEEPER CHECK
  const validation = await validateSubjectTopic(context);
  if (!validation.valid) {
    return { text: validation.message, provider: "validator" };
  }

  const userPrompt = `SUBJECT: ${context.subject}\nTOPIC: ${context.topic}\nCLASS: ${context.class}\nTERM: ${context.term}\nWEEK: ${context.week}`;

  // 2. PREMIUM PATH (Claude 3.5 Sonnet)
// 2. PREMIUM PATH (Claude 3.5 Sonnet)
if (isPremium) {
  try {
    console.log(`💎 Premium Generation: Using Claude 3.5 Haiku (Optimized)...`);
    
    const response = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      // ✅ Use the 'system' property directly for the prompt you want to cache
      system: CLAUDE_PREMIUM_SYSTEM_PROMPT, 
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      // ✅ Caching now lives here in the providerOptions at the top level
      providerOptions: {
        anthropic: {
          cacheControl: { type: "ephemeral" },
        },
      },
      temperature: 0.7,
      maxOutputTokens: 4000,
    });

    const inputTokens = response.usage?.inputTokens ?? 0;
    const outputTokens = response.usage?.outputTokens ?? 0;
    const cacheReadTokens = response.usage?.inputTokenDetails?.cacheReadTokens ?? 0;

   // ✅ 2026 Haiku 4.5 Pricing Logic
    const normalInputTokens = inputTokens - cacheReadTokens;
    const estimatedCost = 
      (normalInputTokens * 0.000001) + // $1.00 per 1M
      (cacheReadTokens * 0.0000001) +  // $0.10 per 1M (Cache Read)
      (outputTokens * 0.000005);       // $5.00 per 1M

    return { 
     text: response.text, 
      provider: "anthropic-haiku-premium", 
      usage: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          cacheReadTokens: cacheReadTokens,
          estimatedCost: estimatedCost
      }
    };
  } catch (err: any) {
    console.error("❌ CLAUDE PREMIUM ERROR:", err.message);
  }
}


  // 3. FREE PATH / FALLBACK (Groq)
  try {
    console.log("⚡ Using Groq Engine (Free Tier)...");
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: GROQ_FREE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.6,
      maxOutputTokens: 3000,
    });

    return { 
      text: response.text, 
      provider: isPremium ? "premium-fallback-groq" : "groq-free",
      usage: {
          promptTokens: response.usage.inputTokens, // SDK 6.x naming
          completionTokens: response.usage.outputTokens
      }
    };
  } catch (err: any) {
    console.error("❌ Both engines failed:", err.message);
    throw new Error("Service temporarily unavailable.");
  }
}

/**
 * 🛠️ THE REFINE ENGINE
 */
/**
 * 🛠️ THE REFINE ENGINE (Optimized for Groq & Low Cost)
 */
export async function refineLessonNote(originalContent: string, instruction: string) {
  const refinementPrompt = `
    ROLE: Senior Nigerian Teacher (Editor Mode).
    TASK: Apply the user's CORRECTION to the lesson note.
    
    INSTRUCTION: "${instruction}"
    
    ORIGINAL CONTENT:
    ${originalContent}

    RULES:
    1. Do NOT rewrite the entire note from scratch. 
    2. ONLY modify the specific sections affected by the instruction.
    3. Keep all other sections (A, B, C, etc.) exactly as they were.
    4. Maintain the professional Ministry-ready tone.
    5. Return the FULL updated note with your changes integrated.
  `;

  try {
    console.log("⚡ Refinement: Using Groq Llama 3.3 (Zero Cost Correction)...");
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"), // Forces Groq as agreed
      prompt: refinementPrompt,
      temperature: 0.2, // Lower temperature = more precise editing
      maxOutputTokens: 3500, // Enough room for the full note
    });

    return { 
        text: response.text, 
        provider: "groq-refiner",
        usage: {
            promptTokens: response.usage.inputTokens,
            completionTokens: response.usage.outputTokens,
            estimatedCost: 0 // Groq is effectively free/cheap for this
        }
    };
  } catch (err) {
    console.error("❌ REFINEMENT ERROR:", err);
    throw new Error("Refinement failed.");
  }
}