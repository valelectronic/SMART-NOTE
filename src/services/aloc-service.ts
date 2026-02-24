/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


/**
 * ALOC Past Questions Service
 * API: https://questions.aloc.com.ng
 * License: MIT (free, open-source)
 * Coverage: WAEC, NECO, UTME, Post-UTME — Senior Secondary only
 *
 * SETUP: Sign up at https://questions.aloc.com.ng to get your Access Token
 * Add to your .env: ALOC_API_TOKEN=your_token_here
 */

// ─── SUBJECT MAP ──────────────────────────────────────────────────────────────
// Maps your internal subject names → ALOC's expected subject slug
// Source: https://github.com/Seunope/aloc-endpoints/blob/master/app/functions.php
const ALOC_SUBJECT_MAP: Record<string, string> = {
  "english language":       "english",
  "mathematics":            "mathematics",
  "further mathematics":    "mathematics",   // ALOC has no further maths — use maths
  "physics":                "physics",
  "chemistry":              "chemistry",
  "biology":                "biology",
  "economics":              "economics",
  "government":             "government",
  "commerce":               "commerce",
  "financial accounting":   "accounting",
  "geography":              "geography",
  "literature in english":  "englishlit",
  "agricultural science":   "biology",       // closest available
  "civic education":        "civiledu",
  "crs":                    "crk",
  "irs":                    "irk",
};

// ─── EXAM TYPE MAP ────────────────────────────────────────────────────────────
// Maps exam labels in your app → ALOC's type parameter
const ALOC_EXAM_TYPES = ["waec", "neco", "utme", "post-utme"] as const;
type AlocExamType = typeof ALOC_EXAM_TYPES[number];

// ─── RESPONSE TYPES ───────────────────────────────────────────────────────────
export interface AlocQuestion {
  id: number;
  question: string;
  option: {
    a: string;
    b: string;
    c: string;
    d: string;
    e?: string;
  };
  answer: string;           // "a" | "b" | "c" | "d"
  examtype: string;         // "waec" | "utme" | "neco" etc
  examyear: string;         // "2018" etc
  subject: string;
}

export interface AlocResult {
  questions: AlocQuestion[];
  source: "aloc" | "fallback";
  examType: string;
}

// ─── MAIN FETCH FUNCTION ──────────────────────────────────────────────────────
/**
 * Fetches real past questions from ALOC for a given subject.
 * Returns null if subject is not supported (JSS, Primary, or unmapped subject).
 *
 * @param subject   - The subject name from your onboarding data
 * @param classLevel - The class level — used to gate JSS/Primary (no ALOC coverage)
 * @param count     - How many questions to fetch (max 10 for assignment section)
 * @param examType  - "waec" | "neco" | "utme" (defaults to waec for SSS)
 */
export async function fetchAlocQuestions(
  subject: string,
  classLevel: string,
  count: number = 4,
  examType: AlocExamType = "waec"
): Promise<AlocResult | null> {

  // ── Gate 1: Only SSS gets real past questions ──────────────────────────────
  const level = classLevel.toLowerCase();
  const isSecondary = !level.includes("primary") && !level.includes("basic") &&
                      !level.includes("jss") && !level.includes("junior");

  if (!isSecondary) {
    // JSS and Primary have no ALOC coverage — caller should use AI-generated questions
    return null;
  }

  // ── Gate 2: Subject must be in ALOC's database ────────────────────────────
  const normalised = subject.toLowerCase().trim();
  const alocSubject = ALOC_SUBJECT_MAP[normalised];

  if (!alocSubject) {
    // Subject not in ALOC — caller falls back to AI-generated questions
    return null;
  }

  // ── Fetch from ALOC API ───────────────────────────────────────────────────
  const token = process.env.ALOC_API_TOKEN;
  if (!token) {
    console.warn("ALOC_API_TOKEN not set — skipping past question fetch");
    return null;
  }

  try {
    // /api/v2/m returns up to 40 questions; we fetch and slice to `count`
    const url = `https://questions.aloc.com.ng/api/v2/m?subject=${alocSubject}&type=${examType}`;

    const res = await fetch(url, {
      headers: {
        "AccessToken": token,
        "Accept": "application/json",
      },
      // 5 second timeout — don't let a slow API block note generation
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`ALOC API returned ${res.status} for ${alocSubject}`);
      return null;
    }

    const data = await res.json();

    // ALOC returns { status, data: [...] }
    const questions: AlocQuestion[] = (data?.data ?? []).slice(0, count);

    if (questions.length === 0) return null;

    return {
      questions,
      source: "aloc",
      examType,
    };

  } catch (err: any) {
    // Timeout or network error — fail silently, AI will generate questions instead
    console.warn("ALOC fetch failed:", err.message);
    return null;
  }
}

// ─── FORMAT FOR INJECTION INTO LESSON NOTE ───────────────────────────────────
/**
 * Formats ALOC questions into a markdown block ready for injection
 * into Section G of the lesson note.
 */
export function formatAlocQuestionsForNote(result: AlocResult): string {
  if (!result || result.questions.length === 0) return "";

  const lines: string[] = [
    "**G. ASSIGNMENT — Real Past Exam Questions**\n",
  ];

  result.questions.forEach((q, i) => {
    const examLabel = q.examtype?.toUpperCase() ?? result.examType.toUpperCase();
    const year = q.examyear ?? "–";

    lines.push(`**${i + 1}. (${examLabel} ${year})**`);
    lines.push(q.question);

    if (q.option) {
      lines.push(`A) ${q.option.a}`);
      lines.push(`B) ${q.option.b}`);
      lines.push(`C) ${q.option.c}`);
      lines.push(`D) ${q.option.d}`);
      if (q.option.e) lines.push(`E) ${q.option.e}`);
    }

    lines.push(`**Answer: ${q.answer?.toUpperCase()}**\n`);
  });

  return lines.join("\n");
}