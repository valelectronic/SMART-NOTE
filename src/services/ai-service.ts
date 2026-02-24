
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

// ─── PROVIDERS ────────────────────────────────────────────────────────────────
const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// ─── SUBJECT ALIAS MAP ────────────────────────────────────────────────────────
const SUBJECT_ALIASES: Record<string, string> = {
  "math": "mathematics", "maths": "mathematics", "general mathematics": "mathematics",
  "core mathematics": "mathematics", "general maths": "mathematics",
  "further maths": "further mathematics", "add maths": "further mathematics",
  "additional mathematics": "further mathematics",
  "english": "english language", "english studies": "english language", "oral english": "english language",
  "literature": "literature in english", "lit in english": "literature in english", "lit": "literature in english",
  "accounting": "financial accounting", "accounts": "financial accounting",
  "book keeping": "financial accounting", "bookkeeping": "financial accounting",
  "integrated science": "basic science", "general science": "basic science",
  "christian religious studies": "crs", "christian religious knowledge": "crs", "crk": "crs",
  "islamic religious studies": "irs", "islamic religious knowledge": "irs", "irk": "irs",
  "social study": "social studies",
  "agriculture": "agricultural science", "agric": "agricultural science", "agric science": "agricultural science",
  "commercial studies": "commerce",
  "computer science": "computer studies", "ict": "computer studies", "information technology": "computer studies",
  "government studies": "government", "politics": "government",
  "home econs": "home economics",
  "creative arts": "cultural and creative arts", "cultural & creative arts": "cultural and creative arts",
  "cca": "cultural and creative arts", "fine arts": "cultural and creative arts", "arts": "cultural and creative arts",
};

function normalizeSubject(subject: string): string {
  const clean = subject.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
  return SUBJECT_ALIASES[clean] ?? clean;
}


// ─── DISPLAY FORMATTERS ────────────────────────────────────────────────────────

// Converts DB class keys to human-readable display names.
// Handles formats: "sss_1_3", "jss_2_1", "primary_4", "SS 1", "JSS 2", "Primary 4"
function formatClass(raw: string): string {
  if (!raw) return "Not specified";
  const s = raw.toLowerCase().replace(/[-\s]+/g, "_");

  // Already human-readable (no underscores after normalisation) — return cleaned up
  if (!s.includes("_")) {
    return raw.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Pattern: sss_1_3 → SS 1, jss_2_1 → JSS 2, primary_4 → Primary 4
  // IMPORTANT: check jss before sss — 'jss' contains 'ss' so sss regex would match it first
  const jssMatch = s.match(/jss?_?(\d)/);
  const sssMatch = !jssMatch ? s.match(/sss?_?(\d)/) : null;
  const primaryMatch = s.match(/primary_?(\d)/);
  const basicMatch = s.match(/basic_?(\d)/);

  if (jssMatch) return `JSS ${jssMatch[1]}`;
  if (sssMatch) return `SS ${sssMatch[1]}`;
  if (primaryMatch) return `Primary ${primaryMatch[1]}`;
  if (basicMatch) return `Basic ${basicMatch[1]}`;

  // Fallback — clean underscores and title case
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Converts topic strings to Title Case.
// "word processing concept" → "Word Processing Concept"
function formatTopic(raw: string): string {
  if (!raw) return "Not specified";
  // Small words that should stay lowercase (unless first word)
  const minorWords = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it"]);
  return raw
    .toLowerCase()
    .split(" ")
    .map((word, i) => (i === 0 || !minorWords.has(word)) ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(" ");
}

// ─── SUBJECT REGISTRY ─────────────────────────────────────────────────────────
type EducationLevel = "primary" | "junior" | "senior";
interface SubjectMeta { level: EducationLevel; isCalculation: boolean; textbooks: string[]; }

const SUBJECT_REGISTRY: Record<string, SubjectMeta> = {
  "mathematics_primary": { level: "primary", isCalculation: true, textbooks: ["New General Mathematics for Primary Schools by M.F. Tuttuh-Adegun. Learn Africa Plc, Ibadan.", "Primary Mathematics by Macmillan Education Nigeria. Macmillan, Lagos."] },
  "english language_primary": { level: "primary", isCalculation: false, textbooks: ["Oral English for Schools and Colleges by P.A. Okonkwo. African First Publishers, Onitsha.", "New Oxford Primary English by Oxford University Press Nigeria. OUP, Ibadan."] },
  "basic science_primary": { level: "primary", isCalculation: false, textbooks: ["Basic Science and Technology for Primary Schools by Pius Ajibola. Longman Nigeria, Lagos.", "Integrated Science for Primary Schools by A.O. Ibikunle. University Press Plc, Ibadan."] },
  "basic technology_primary": { level: "primary", isCalculation: false, textbooks: ["Basic Technology for Primary Schools by B.O. Abayomi. Evans Brothers Nigeria, Lagos.", "Technology for Nigerian Primary Schools by K.I. Fagbemi. Longman Nigeria, Lagos."] },
  "civic education_primary": { level: "primary", isCalculation: false, textbooks: ["Civic Education for Primary Schools by J.A. Dosumu. University Press Plc, Ibadan.", "Essential Civic Education by O.T. Adeleke. African First Publishers, Onitsha."] },
  "social studies_primary": { level: "primary", isCalculation: false, textbooks: ["Social Studies for Primary Schools by C.O. Ikwuoha. Longman Nigeria, Lagos.", "Understanding Social Studies by A.B. Fafunwa. University Press Plc, Ibadan."] },
  "cultural and creative arts_primary": { level: "primary", isCalculation: false, textbooks: ["Cultural and Creative Arts for Primary Schools by O.A. Bankole. Learn Africa Plc, Ibadan.", "Creative Arts Education by F.I. Ojuawo. Macmillan Nigeria, Lagos."] },
  "agricultural science_primary": { level: "primary", isCalculation: false, textbooks: ["Agricultural Science for Primary Schools by V.A. Oyeniran. Heinemann Educational Books, Ibadan.", "Primary Agriculture by S.A. Akinola. University Press Plc, Ibadan."] },
  "computer studies_primary": { level: "primary", isCalculation: false, textbooks: ["Computer Studies for Primary Schools by J.O. Ajayi. Learn Africa Plc, Ibadan.", "ICT for Primary Schools by B.A. Oduola. Macmillan Nigeria, Lagos."] },
  "crs_primary": { level: "primary", isCalculation: false, textbooks: ["Christian Religious Studies for Primary Schools by E.N. Amucheazi. African First Publishers, Onitsha.", "Living Way CRS by O.A. Adewale. Longman Nigeria, Lagos."] },
  "irs_primary": { level: "primary", isCalculation: false, textbooks: ["Islamic Religious Studies for Primary Schools by A.O. Olawale. University Press Plc, Ibadan.", "IRS for Nigerian Primary Schools by M.A. Bello. African First Publishers, Onitsha."] },
  "mathematics_junior": { level: "junior", isCalculation: true, textbooks: ["New General Mathematics for Junior Secondary Schools 1-3 by M.F. Tuttuh-Adegun. Learn Africa Plc, Ibadan.", "Essential Mathematics for Junior Secondary Schools by A.J.S. Oluwasanmi. Evans Brothers Nigeria, Lagos."] },
  "english language_junior": { level: "junior", isCalculation: false, textbooks: ["Effective English for Junior Secondary Schools by R. Taiwo. Macmillan Nigeria, Lagos.", "English Grammar and Composition by P.O. Olatunbosun. University Press Plc, Ibadan."] },
  "basic science_junior": { level: "junior", isCalculation: false, textbooks: ["Basic Science for Junior Secondary Schools by A.O. Ibikunle. University Press Plc, Ibadan.", "Integrated Science for Junior Secondary Schools by A.I. Owu. Longman Nigeria, Lagos."] },
  "basic technology_junior": { level: "junior", isCalculation: false, textbooks: ["Basic Technology for Junior Secondary Schools by O.O. Atanda. Longman Nigeria, Lagos.", "Junior Secondary Technology by B.A. Akintoye. Evans Brothers Nigeria, Lagos."] },
  "civic education_junior": { level: "junior", isCalculation: false, textbooks: ["Civic Education for Junior Secondary Schools by J.A. Dosumu. University Press Plc, Ibadan.", "Countdown to Civic Education (JSS) by O.T. Adeleke. Evans Brothers Nigeria, Lagos."] },
  "social studies_junior": { level: "junior", isCalculation: false, textbooks: ["Social Studies for Junior Secondary Schools by C.O. Ikwuoha. Longman Nigeria, Lagos.", "Junior Social Studies by B.I. Nwachukwu. University Press Plc, Ibadan."] },
  "business studies_junior": { level: "junior", isCalculation: false, textbooks: ["Business Studies for Junior Secondary Schools by J.U. Anyaele. African First Publishers, Onitsha.", "Junior Business Studies by C.C. Nwosu. University Press Plc, Ibadan."] },
  "agricultural science_junior": { level: "junior", isCalculation: false, textbooks: ["Agricultural Science for Junior Secondary Schools by V.A. Oyeniran. Heinemann Educational Books, Ibadan.", "Junior Agricultural Science by S.A. Akinola. University Press Plc, Ibadan."] },
  "computer studies_junior": { level: "junior", isCalculation: false, textbooks: ["Computer Studies for Junior Secondary Schools by J.O. Ajayi. Learn Africa Plc, Ibadan.", "ICT for Junior Secondary Schools by B.A. Oduola. Macmillan Nigeria, Lagos."] },
  "crs_junior": { level: "junior", isCalculation: false, textbooks: ["Christian Religious Studies for Junior Secondary Schools by E.N. Amucheazi. African First Publishers, Onitsha.", "CRS for JSS by O.A. Adewale. Longman Nigeria, Lagos."] },
  "irs_junior": { level: "junior", isCalculation: false, textbooks: ["Islamic Religious Studies for Junior Secondary Schools by A.O. Olawale. University Press Plc, Ibadan.", "IRS for JSS by M.A. Bello. African First Publishers, Onitsha."] },
  "home economics_junior": { level: "junior", isCalculation: false, textbooks: ["Home Economics for Junior Secondary Schools by G.O. Mbagwu. Longman Nigeria, Lagos.", "Junior Home Economics by B.N. Eze. University Press Plc, Ibadan."] },
  "cultural and creative arts_junior": { level: "junior", isCalculation: false, textbooks: ["Cultural and Creative Arts for JSS by O.A. Bankole. Learn Africa Plc, Ibadan.", "Creative Arts for Junior Secondary Schools by F.I. Ojuawo. Macmillan Nigeria, Lagos."] },
  "mathematics_senior": { level: "senior", isCalculation: true, textbooks: ["New School Mathematics for Senior Secondary Schools by M.F. Tuttuh-Adegun. NPS Educational Publishers, Ibadan.", "Essential Mathematics for Senior Secondary Schools by A.J.S. Oluwasanmi. Evans Brothers Nigeria, Lagos."] },
  "further mathematics_senior": { level: "senior", isCalculation: true, textbooks: ["Further Mathematics Project 1-3 by T. Wiseman & J. Beaumont. Longman Nigeria, Lagos.", "Advance Level Mathematics by Tuttuh-Adegun. NPS Educational Publishers, Ibadan."] },
  "english language_senior": { level: "senior", isCalculation: false, textbooks: ["Oral English for Schools and Colleges by P.A. Okonkwo. African First Publishers, Onitsha.", "Countdown to Senior Secondary Certificate English by R. Taiwo. Evans Brothers Nigeria, Lagos."] },
  "physics_senior": { level: "senior", isCalculation: true, textbooks: ["Comprehensive Physics for Senior Secondary Schools by Olumuyiwa Awe. Johnson Publishers, Lagos.", "Physics for Senior Secondary Schools by M. Nelkon & P. Parker (Nigerian Edition). Longman Nigeria, Lagos."] },
  "chemistry_senior": { level: "senior", isCalculation: true, textbooks: ["New School Chemistry for Senior Secondary Schools by Osei Yaw Ababio. African First Publishers, Onitsha.", "Comprehensive Chemistry by G.I. Ojokuku. Johnson Publishers, Lagos."] },
  "biology_senior": { level: "senior", isCalculation: false, textbooks: ["New School Biology for Senior Secondary Schools by H. Stone & H.N. Cozens (Nigerian Edition). Longman Nigeria, Lagos.", "Comprehensive Biology for Senior Secondary Schools by Idodo Umeh. Idodo-Umeh Publishers, Benin City."] },
  "economics_senior": { level: "senior", isCalculation: false, textbooks: ["New School Economics for Senior Secondary Schools by J.U. Anyaele. African First Publishers, Onitsha.", "Economics for Senior Secondary Schools by C.E. Ande. University Press Plc, Ibadan."] },
  "government_senior": { level: "senior", isCalculation: false, textbooks: ["Government for Senior Secondary Schools by J.U. Anyaele. African First Publishers, Onitsha.", "Comprehensive Government by R.A. Anifowose & F. Enemuo. Malthouse Press, Lagos."] },
  "commerce_senior": { level: "senior", isCalculation: false, textbooks: ["Commerce for Senior Secondary Schools by J.U. Anyaele. African First Publishers, Onitsha.", "Comprehensive Commerce for SSCE by O.A. Longe. Evans Brothers Nigeria, Lagos."] },
  "financial accounting_senior": { level: "senior", isCalculation: true, textbooks: ["Financial Accounting for Senior Secondary Schools by O.A. Longe & R.A. Solaja. Evans Brothers Nigeria, Lagos.", "Simplified Financial Accounting by B.O. Igben. ROI Publishers, Lagos."] },
  "geography_senior": { level: "senior", isCalculation: false, textbooks: ["Certificate Physical and Human Geography by G.C. Leong. Oxford University Press, Ibadan.", "New Certificate Geography for Senior Secondary Schools by I.B. Adeleke. Longman Nigeria, Lagos."] },
  "literature in english_senior": { level: "senior", isCalculation: false, textbooks: ["A Handbook of Literature in English by G.A. Aderemi. Longman Nigeria, Lagos.", "Understanding Literature in English by O.B. Nnolim. University Press Plc, Ibadan."] },
  "agricultural science_senior": { level: "senior", isCalculation: false, textbooks: ["Agricultural Science for Senior Secondary Schools by V.A. Oyeniran & A.O. Fakorede. Heinemann Educational Books, Ibadan.", "Comprehensive Agricultural Science by J.O. Aina. African First Publishers, Onitsha."] },
  "civic education_senior": { level: "senior", isCalculation: false, textbooks: ["Civic Education for Senior Secondary Schools by J.A. Dosumu. University Press Plc, Ibadan.", "Countdown to SSCE Civic Education by O.T. Adeleke. Evans Brothers Nigeria, Lagos."] },
  "crs_senior": { level: "senior", isCalculation: false, textbooks: ["Christian Religious Studies for Senior Secondary Schools by E.N. Amucheazi. African First Publishers, Onitsha.", "Comprehensive CRS by O.A. Adewale. Longman Nigeria, Lagos."] },
  "irs_senior": { level: "senior", isCalculation: false, textbooks: ["Islamic Religious Studies for Senior Secondary Schools by A.O. Olawale. University Press Plc, Ibadan.", "Comprehensive IRS by M.A. Bello. African First Publishers, Onitsha."] },
  "computer studies_senior": { level: "senior", isCalculation: false, textbooks: ["Computer Studies for Senior Secondary Schools by O.A. Longe. Tonad Publishers, Lagos.", "Comprehensive Computer Studies for SSCE by J.O. Ajayi. Learn Africa Plc, Ibadan."] },
  "home economics_senior": { level: "senior", isCalculation: false, textbooks: ["Home Economics for Senior Secondary Schools by G.O. Mbagwu. Longman Nigeria, Lagos.", "Comprehensive Home Economics for SSCE by B.N. Eze. University Press Plc, Ibadan."] },
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getEducationLevel(classLevel: string): EducationLevel {
  const l = classLevel.toLowerCase();
  if (l.includes("primary") || l.includes("basic") || /primary\s*[1-6]/.test(l) || /basic\s*[1-6]/.test(l)) return "primary";
  if (l.includes("jss") || l.includes("junior")) return "junior";
  return "senior";
}

function getSubjectMeta(subject: string, classLevel: string): SubjectMeta | null {
  const level = getEducationLevel(classLevel);
  return SUBJECT_REGISTRY[`${normalizeSubject(subject)}_${level}`] ?? null;
}

function isCalculationSubject(subject: string, classLevel: string): boolean {
  const meta = getSubjectMeta(subject, classLevel);
  if (meta) return meta.isCalculation;
  return ["mathematics", "physics", "chemistry", "accounting"].some(k => subject.toLowerCase().includes(k));
}

function getReference(subject: string, classLevel: string): string {
  return getSubjectMeta(subject, classLevel)?.textbooks[0]
    ?? `A standard Nigerian NERDC-approved textbook for ${subject}.`;
}

function getAllReferences(subject: string, classLevel: string): string {
  const meta = getSubjectMeta(subject, classLevel);
  if (meta) {
    const books = meta.textbooks.map((b, i) => `${i + 1}. ${b}`).join("\n");
    return `${books}\n\n[Use ONLY the books listed above. Do not add, invent, or guess additional titles.]`;
  }
  return `Write exactly 2 real, verifiable Nigerian-published textbooks for ${subject} at this level. Format: 1. Title by Author. Publisher, City. — 2. Title by Author. Publisher, City. Use only books that genuinely exist. Do NOT fabricate, guess, or add extra titles beyond these 2.`;
}

function getAssignmentRule(level: EducationLevel): string {
  if (level === "primary") {
    return `Write 3 simple homework questions. Use fill-in-the-blank or short answer. No WAEC/JAMB labels.`;
  }
  if (level === "junior") {
    return `Write 3-4 homework questions in BECE style. Label each **(BECE Practice):**.`;
  }
  return `Write 3-4 questions mixing:
* **(WAEC Practice):** essay question with marks, e.g. [10 marks]
* **(JAMB Practice):** objective question followed by indented options:
  * A) option
  * B) option
  * C) option
  * D) option`;
}

// ─── TERMINOLOGY DEPTH ───────────────────────────────────────────────────────
// Returns a one-line instruction on the expected language register for this subject.
// List type selection is handled by CONTENT_RULES rule 3 — not here.
function getTerminologyNote(subject: string): string {
  const s = normalizeSubject(subject);
  if (["biology","basic science","chemistry","physics","agricultural science","home economics"].includes(s))
    return "Use precise scientific terminology throughout. Express any processes or reactions accurately.";
  if (["economics","commerce","financial accounting","business studies"].includes(s))
    return "Use correct economic and commercial terminology throughout.";
  if (["government","civic education","social studies"].includes(s))
    return "Use correct political and civic terminology throughout.";
  if (["mathematics","further mathematics"].includes(s))
    return "Use precise mathematical language. Express all formulas and values in LaTeX.";
  if (["english language","literature in english"].includes(s))
    return "Use correct literary and linguistic terminology throughout.";
  if (["crs","irs"].includes(s))
    return "Use respectful religious language. Apply teachings to everyday Nigerian student life.";
  if (["computer studies"].includes(s))
    return "Use correct ICT terminology throughout.";
  if (["geography"].includes(s))
    return "Use correct geographical terminology throughout.";
  return "Use correct subject-specific terminology throughout.";
}

// ─── HEADER BUILDER ───────────────────────────────────────────────────────────
// Builds the lesson note header with REAL data from the database — no placeholders.
function buildHeader(ctx: any, subject: string): string {
  const school   = ctx.schoolName              ?? "Not specified";
  const cls      = formatClass(ctx.class       ?? "");
  const term     = ctx.term                    ?? "Not specified";
  const week     = ctx.week                    ?? "Not specified";
  const topic    = formatTopic(ctx.topic       ?? "");
  const teacher  = ctx.teacherName             ?? "Not specified";
  const ref      = getReference(subject, ctx.class ?? "");

  // Build sub-topics block from database value
  const subTopicsBlock = buildSubTopicsBlock(ctx.subTopics, ctx.topic ?? "");

  return `LESSON NOTE

**SCHOOL:** ${school}

**SUBJECT:** ${subject}

**CLASS:** ${cls}

**TERM:** ${term}

**WEEK:** ${week}

**TOPIC:** ${topic}

**SUB-TOPICS:**
${subTopicsBlock}

**REFERENCE:** ${ref}

**TEACHER:** ${teacher}`;
}

// ─── SUB-TOPICS EXTRACTOR ─────────────────────────────────────────────────────
// Always converts whatever the DB sends into a clean list of sub-topic headings.
// Works for arrays, proper comma lists, description strings, and everything between.
// Returns null only when nothing was provided — AI then generates freely.

const SUB_TOPIC_ACRONYMS = new Set([
  "cbn","ndic","sec","nafdac","inec","nass","wto","imf","vat","gdp","gnp",
  "cac","frsc","efcc","icpc","crs","irs","cbk","nnpc","firs","cbn",
]);

const MINOR_WORDS_ST = new Set([
  "a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it",
]);

function stTitleCase(s: string): string {
  return s.trim().split(" ").map((w, i) => {
    // Strip surrounding punctuation to check the core word
    const core = w.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
    const wl = core.toLowerCase();
    // Preserve known acronyms and any all-caps word (CBN, NDIC, SEC, GDP, etc.)
    if (core.length > 1 && (SUB_TOPIC_ACRONYMS.has(wl) || core === core.toUpperCase())) return w;
    if (i === 0 || !MINOR_WORDS_ST.has(wl)) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    return w.toLowerCase();
  }).join(" ");
}

function isStandaloneAcronym(s: string): boolean {
  const words = s.trim().split(/\s+/);
  if (words.length !== 1) return false;
  return SUB_TOPIC_ACRONYMS.has(s.toLowerCase()) || s === s.toUpperCase();
}

function extractSubTopics(raw: any, topic: string): string[] | null {
  const rawItems: string[] = [];

  if (Array.isArray(raw) && raw.length > 0) {
    for (const t of raw) {
      const s = String(t).trim();
      if (s) rawItems.push(s);
    }
  } else if (typeof raw === "string" && raw.trim()) {
    const parts = raw.trim().split(/[,;\n]+/).map((s: string) => s.trim()).filter(Boolean);
    for (const part of parts) {
      // Split "X and Y" only when left side is short (≤3 words) — a heading keyword
      const andMatch = part.match(/^(.+?)\s+and\s+(.+)$/i);
      if (andMatch) {
        const left = andMatch[1].trim();
        const right = andMatch[2].trim();
        // Only split when BOTH sides are exactly 1 word — pure keyword pairs
        // e.g. "importance and problems" → both 1 word → split ✅
        // e.g. "merits and demerits" → both 1 word → split ✅
        // e.g. "light and dark reactions" → right=2 words → keep together ✅
        // e.g. "causes and effects of inflation" → right=3 words → keep together ✅
        if (left.split(/\s+/).length === 1 && right.split(/\s+/).length === 1) {
          rawItems.push(left);
          rawItems.push(right);
        } else {
          rawItems.push(part);
        }
      } else {
        rawItems.push(part);
      }
    }
  }

  if (rawItems.length === 0) return null;

  // Merge standalone acronyms into the previous item
  const merged: string[] = [];
  for (const item of rawItems) {
    if (merged.length > 0 && isStandaloneAcronym(item)) {
      const prev = merged[merged.length - 1];
      const acronym = item.toUpperCase();
      if (!prev.includes("(")) {
        merged[merged.length - 1] = prev + ` (e.g. ${acronym})`;
      } else {
        merged[merged.length - 1] = prev.replace(/\)$/, `, ${acronym})`);
      }
    } else {
      merged.push(item);
    }
  }

  // Title-case every heading
  let headings = merged.map(stTitleCase);

  // Deduplicate
  const seen = new Set<string>();
  headings = headings.filter(h => {
    const k = h.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Ensure intro-style heading is first
  const introKw = new Set(["introduction","meaning","definition","overview","background","concept"]);
  const hasIntro = headings.some(h => introKw.has(h.toLowerCase().split(" ")[0]));
  if (!hasIntro) headings.unshift(`Introduction to ${stTitleCase(topic)}`);

  // Ensure Summary is last
  if (!headings.some(h => h.toLowerCase().includes("summary"))) headings.push("Summary");

  return headings;
}

// Builds the header SUB-TOPICS display block
function buildSubTopicsBlock(raw: any, topic: string): string {
  const headings = extractSubTopics(raw, topic);
  if (headings) return headings.map((h, i) => `${i + 1}. ${h}`).join("\n");
  return "[Sub-topics will be determined by the teacher's topic description]";
}

// ─── UNIVERSAL CONTENT PATTERN ────────────────────────────────────────────────
// Generic — works for every subject. The subject-type hint adapts it per discipline.
const CONTENT_RULES = `
CONTENT RULES — every sub-topic, every subject:

0. The Section II template contains pre-written ### headings followed by [FILL]. Replace each [FILL] with the full content for that sub-topic. Never change the ### heading text above a [FILL]. Never skip a [FILL].

1. Maximum 2 sentences before the list. Never a paragraph.

2. Choose the list type that fits the content:
   - Numbered (1. 2. 3.) for features, functions, causes, effects, steps, rules
   - Lettered (a. b. c.) for named components, parts, branches, arms — each on its own line with a blank line between items
   - Bullet (* item) for examples or unordered points
   - If a sub-topic covers both advantages AND disadvantages: two separate labelled groups (**Advantages:** then **Disadvantages:**), never mixed

3. Every list item is a complete explanatory sentence — never a bare label or word. Detailed enough that a student understands without a teacher.

4. Each sub-topic covers unique content — no repetition across sub-topics.

5. No filler. No narrative phrases. Write content directly.

6. The Summary sub-topic starts immediately with bullet points — no opening sentence.
`.trim();

// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildSecondaryFreePrompt(ctx: any, headings: string[]): string {
  const subject = ctx.subject;
  const classLevel = ctx.class ?? "";
  const level = getEducationLevel(classLevel);

  const depthNote = level === "junior"
    ? "Write for JSS students aged 10-14. Use simple English. Define every new term immediately when first used."
    : "Write for SSS students aged 15-18. Use correct subject terminology. Depth and detail sufficient for WAEC/JAMB examinations.";

  const terminologyNote = getTerminologyNote(subject);
  const header = buildHeader(ctx, subject);

  // Section II: write headings as committed markdown — AI must fill content beneath each one.
  // Bracket instructions are ignored by models; pre-written headings cannot be.
  const sectionII = headings.length > 0
    ? headings.map((h, i) => `### ${i + 1}. ${h}`).join("\n\n[FILL]\n\n")
      + "\n\n[FILL]"
    : `### 1. [Generate appropriate sub-topics for "${ctx.topic}" in ${subject}. Write 5-6 sub-topics as ### numbered headings. End with Summary. Follow all CONTENT RULES.]`;

  return `You are a Nigerian secondary school teacher writing a formal lesson note for **${subject}**.

DEPTH REQUIREMENTS:
- Every list item must be a complete explanatory sentence — minimum 15 words
- Write as many list items as the topic genuinely requires — never cut a list short
- When a sub-topic heading is a single word (e.g. "Meaning", "Types", "Importance") — use your full curriculum knowledge to write rich, thorough content under that heading. A short heading does not mean short content.
- Performance Objectives: exactly 5 | Evaluation: 4 questions | Assignment: 3-4 questions
- MINIMUM TOTAL LENGTH: 800 words. If below, deepen the thinnest sub-topics with more genuine content — not repeated content

${depthNote}

TERMINOLOGY: ${terminologyNote}

Output format: ReactMarkdown. Use ## for section headings, ### for sub-topic headings, **bold**, numbered/lettered/bullet lists, --- between major sections.

${CONTENT_RULES}

---

Write the complete lesson note. The header below is filled with real data — copy it exactly.

${header}

---

## I. PERFORMANCE OBJECTIVES

By the end of this lesson, students should be able to:

1. [Bloom's verb + specific measurable outcome for this topic]
2. [objective]
3. [objective]
4. [objective]
5. [objective]

---

## II. CONTENT

${sectionII}

---

## III. EVALUATION (CLASS WORK)

1. [question — no answer given]
2. [question]
3. [question]
4. [question]

---

## IV. ASSIGNMENT

${getAssignmentRule(level)}

---

## V. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}`;
}

function buildSecondaryPremiumPrompt(ctx: any, headings: string[]): string {
  const subject = ctx.subject;
  const classLevel = ctx.class ?? "";
  const level = getEducationLevel(classLevel);

  const depthNote = level === "junior"
    ? "Write for JSS students aged 10-14. Simple English. Define every term when first used."
    : "Write for SSS students aged 15-18. Precise terminology. Nigerian institutional depth. WAEC/JAMB ready.";

  const terminologyNote = getTerminologyNote(subject);
  const header = buildHeader(ctx, subject);

  const sectionII = headings.length > 0
    ? headings.map((h, i) => `### ${i + 1}. ${h}`).join("\n\n[FILL]\n\n")
      + "\n\n[FILL]"
    : `### 1. [Generate appropriate sub-topics for "${ctx.topic}" in ${subject}. Write 5-6 sub-topics as ### numbered headings. End with Summary. Follow all CONTENT RULES.]`;

  return `You are a senior Nigerian secondary school teacher writing a formal, inspection-ready lesson note for **${subject}**.

DEPTH REQUIREMENTS:
- Every list item must be a complete explanatory sentence — 15 to 25 words — WAEC/JAMB depth
- Write as many list items as the topic genuinely requires — never cut a list short
- When a sub-topic heading is a single word (e.g. "Meaning", "Types", "Importance") — use your full curriculum knowledge to write rich, thorough content under that heading. A short heading does not mean short content.
- Performance Objectives: exactly 5 | Evaluation: 4 questions | Assignment: 3-4 questions
- Include a Mermaid flowchart diagram relevant to this topic
- MINIMUM TOTAL LENGTH: 900 words. If below, deepen the thinnest sub-topics with more genuine content — not repeated content

${depthNote}

TERMINOLOGY: ${terminologyNote}

Output format: ReactMarkdown + Mermaid.js. Use ## for sections, ### for sub-topics, **bold**, lists, --- between sections, \`\`\`mermaid\`\`\` for diagrams.

${CONTENT_RULES}

---

Write the complete lesson note. The header below is filled with real data — copy it exactly.

${header}

---

## I. PERFORMANCE OBJECTIVES

By the end of this lesson, students should be able to:

1. [Bloom's verb + specific measurable outcome]
2. [objective]
3. [objective]
4. [objective]
5. [objective]

---

## II. CONTENT

${sectionII}

---

## III. DIAGRAM: ${ctx.topic ?? subject}

\`\`\`mermaid
flowchart TD
  A[Main Concept] --> B[Component 1]
  A --> C[Component 2]
  B --> D[Detail]
  C --> E[Detail]
  D --> F[Outcome]
\`\`\`

*[One sentence explaining what this diagram illustrates.]*

---

## IV. EVALUATION (CLASS WORK)

1. [question — no answer]
2. [question]
3. [question]
4. [question]

---

## V. ASSIGNMENT

${getAssignmentRule(level)}

---

## VI. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}`;
}

function buildPrimaryPrompt(ctx: any, headings: string[]): string {
  const subject = ctx.subject;
  const classLevel = ctx.class ?? "";
  const header = buildHeader(ctx, subject);

  const sectionII = headings.length > 0
    ? headings.map((h, i) => `### ${i + 1}. ${h}`).join("\n\n[FILL]\n\n")
      + "\n\n[FILL]"
    : `### 1. [Generate appropriate sub-topics for "${ctx.topic}" in ${subject}. Write 4-5 sub-topics as ### numbered headings in simple language. End with Summary. Follow all CONTENT RULES.]`;

  return `You are a Nigerian primary school teacher writing a formal lesson note for **${subject}**.

DEPTH REQUIREMENTS:
- Every list item must be a complete sentence — minimum 12 words — in simple language a pupil aged 6-12 understands
- Write as many list items as the topic genuinely requires — never cut a list short
- When a sub-topic heading is a single word (e.g. "Meaning", "Types", "Uses") — use your curriculum knowledge to write full, clear content under that heading in simple language.
- Performance Objectives: exactly 4 | Evaluation: 3 questions | Assignment: 3 questions
- MINIMUM TOTAL LENGTH: 800 words. If below, deepen the thinnest sub-topics with more genuine content — not repeated content

Write for pupils aged 6-12. Use simple, short sentences. Explain every new word when first used. Use Nigerian examples — market, home, school, food, naira, farm.

Output format: ReactMarkdown. Use ## for sections, ### for sub-topics, **bold**, lists, --- between sections.

${CONTENT_RULES}

---

Write the complete lesson note. The header below is filled with real data — copy it exactly.

${header}

---

## I. PERFORMANCE OBJECTIVES

By the end of this lesson, pupils should be able to:

1. [simple verb — Name / Write / Identify / State + concept]
2. [objective]
3. [objective]
4. [objective]

---

## II. CONTENT

${sectionII}

---

## III. EVALUATION (CLASS WORK)

1. [simple question — no answer]
2. [question]
3. [question]

---

## IV. ASSIGNMENT

${getAssignmentRule("primary")}

---

## V. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}`;
}

function buildCalculationPrompt(ctx: any): string {
  const subject = ctx.subject;
  const classLevel = ctx.class ?? "";
  const level = getEducationLevel(classLevel);
  const isMaths = ["mathematics", "further mathematics"].includes(normalizeSubject(subject));
  const header = buildHeader(ctx, subject);

  const depthNote = level === "junior"
    ? "Write for JSS students aged 10-14. Simple language. Nigerian daily-life examples — sharing food, counting naira, measuring distances. Difficulty = JSS curriculum only."
    : "Write for SSS students aged 15-18 preparing for WAEC/JAMB. Precise mathematical language. Multi-step reasoning.";

  const exampleCount = isMaths ? "minimum 4 worked examples" : "minimum 2 worked examples";
  const styleNote = isMaths
    ? "Minimise prose. After the definition and formula, go straight to worked examples."
    : "Give the theory in 2-3 sentences, then prove it with worked calculations.";

  return `You are a Nigerian secondary school ${subject} teacher and WAEC examiner.

DEPTH REQUIREMENTS:
- Write a minimum of 4 fully worked examples for Mathematics; minimum 2 for Physics/Chemistry
- Every worked example must show all steps in the aligned solution block — never skip or compress steps
- If the topic has more than 4 natural example types (e.g. different formula applications), write them all
- Practice Problems section must have exactly 3 problems (easy, medium, hard)
- Evaluation must have 3 problems with answers shown; Assignment must have 3-4 questions
- Each worked example must be detailed enough that a student can follow every step without a teacher
- MINIMUM TOTAL LENGTH: 800 words. If the note is below 800 words, add more worked examples of increasing difficulty — never add prose padding

${depthNote}
${styleNote}

Your output is rendered by ReactMarkdown + KaTeX. Use proper Markdown headings and LaTeX for all mathematics.

LaTeX rules:
* All expressions: $inline$ or $$display$$ — never plain text
* Multiplication: $a \\times b$ — never * or x
* Fractions: $\\frac{a}{b}$ — never a/b
* Angles: $\\angle ABC = 90^\\circ$

Worked example format — use for EVERY example:

### Example [n]: [Short description]

* **Given:** [data with units]
* **Required:** [what to find]
* **Formula:** $$[formula]$$

**Solution:**

$$\\begin{aligned}
[step] &= [result] \\\\
[step] &= [result] \\\\
[step] &= [final answer]
\\end{aligned}$$

**Answer:** $\\boxed{[final answer with units]}$

---

Write the complete lesson note. The header below is filled with real data — copy it exactly.

${header}

---

## I. PERFORMANCE OBJECTIVES

By the end of this lesson, students should be able to:

1. State the definition and key formula for this topic.
2. Identify and apply the correct formula to solve problems.
3. Solve step-by-step problems involving this topic.
4. Apply this concept to real-life situations in Nigeria.

---

## II. CONTENT

### 1. Definition and Key Concepts

[One-sentence definition. One sentence of Nigerian context.]

**Key Formula:**

$$[main formula]$$

**Where:**

* $[variable]$ = [meaning with units]
* $[variable]$ = [meaning with units]

### 2. Worked Examples

[Write ${exampleCount}, increasing in difficulty. Use the worked example format above for every single one.]

### 3. Practice Problems

**Attempt the following:**

1. [easy problem]
2. [medium problem]
3. [hard problem]

---

## III. EVALUATION (CLASS WORK)

1. [problem] *(Answer: ...)*
2. [problem] *(Answer: ...)*
3. [problem] *(Answer: ...)*

---

## IV. ASSIGNMENT

${getAssignmentRule(level)}

---

## V. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}`;
}

// ─── PROMPT SELECTOR ─────────────────────────────────────────────────────────
// Now receives full context so each builder can inject real data into the header.
function getSystemPrompt(ctx: any, isPremium: boolean, headings: string[]): string {
  const subject = ctx.subject ?? "";
  const classLevel = ctx.class ?? "";
  const level = getEducationLevel(classLevel);

  if (level === "primary") return buildPrimaryPrompt(ctx, headings);
  if (isCalculationSubject(subject, classLevel)) return buildCalculationPrompt(ctx);
  return isPremium ? buildSecondaryPremiumPrompt(ctx, headings) : buildSecondaryFreePrompt(ctx, headings);
}

// ─── VALIDATOR ────────────────────────────────────────────────────────────────
async function validateSubjectTopic(context: any): Promise<{ valid: boolean; message?: string }> {
  const prompt = `You are a Nigerian curriculum specialist.
Is this topic valid for this subject in Nigerian schools?
Subject: "${context.subject}", Topic: "${context.topic}", Class: "${context.class}"
Reply with ONE line only:
- If valid: VALID
- If not: Curriculum Error: [topic] is not part of [subject]. It belongs to [correct subject].`;

  try {
    const { text } = await generateText({ model: groq("llama-3.3-70b-versatile"), prompt, temperature: 0 });
    const upper = text.trim().toUpperCase();
    if (upper.startsWith("VALID")) return { valid: true };
    return { valid: false, message: text.trim() };
  } catch {
    return { valid: true };
  }
}

// ─── MAIN GENERATION ──────────────────────────────────────────────────────────
export async function generateLessonNote(context: any, isPremium: boolean) {
  const validation = await validateSubjectTopic(context);
  if (!validation.valid) return { text: validation.message, provider: "validator" };

  // Extract concrete sub-topic headings FIRST — passed to system prompt builder
  const resolvedHeadings = extractSubTopics(context.subTopics, context.topic ?? "");

  // Build system prompt — two distinct paths:
  // 1. Headings resolved from DB → pass them locked into Section II template
  // 2. No headings at all → pass empty array; each builder handles this with a free-generation Section II
  const headingsForPrompt = resolvedHeadings ?? [];
  const systemPrompt = getSystemPrompt(context, isPremium, headingsForPrompt);

  const userPrompt = `Write the complete lesson note for the topic: "${context.topic}". Follow all instructions in your system prompt exactly. Start with LESSON NOTE immediately.`.trim();

  if (isPremium) {
    try {
      const response = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: isCalculationSubject(context.subject, context.class) ? 0.2 : 0.4,
        maxOutputTokens: 4000,
      });
      return {
        text: response.text.trim(),
        provider: "anthropic-haiku-premium",
        usage: { promptTokens: response.usage.inputTokens ?? 0, completionTokens: response.usage.outputTokens ?? 0 },
      };
    } catch (err) {
      console.error("Claude failed, falling back to Groq:", err);
    }
  }

  try {
    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: isCalculationSubject(context.subject, context.class) ? 0.2 : 0.3,
      maxOutputTokens: 4000,
    });
    return {
      text: response.text.trim(),
      provider: isPremium ? "premium-fallback-groq" : "groq-free",
      usage: { promptTokens: response.usage.inputTokens ?? 0, completionTokens: response.usage.outputTokens ?? 0 },
    };
  } catch (err: any) {
    console.error("Both engines failed:", err.message);
    throw new Error("Service temporarily unavailable.");
  }
}

// ─── REFINER ──────────────────────────────────────────────────────────────────
export async function refineLessonNote(originalContent: string, instruction: string, isPremiumActive: boolean) {
  const prompt = `You are editing a Nigerian school lesson note. This note may be for any subject — Mathematics, Biology, Economics, Government, English, Agricultural Science, CRS, Geography, Computer Studies, Home Economics, or any other Nigerian school subject. Apply the requested change correctly and completely regardless of subject.

INSTRUCTION: "${instruction}"

HOW TO APPLY CHANGES — works for any subject:
- ADD something (e.g. "add disadvantages", "add more types", "add examples", "add a table") — find the right sub-topic in Section II and insert properly formatted content there, not at the end of the note
- EXPAND or EXPLAIN something (e.g. "explain the types more", "add more detail to functions") — rewrite that specific sub-topic with fuller explanations on every list item
- FIX or CORRECT something (e.g. "fix the evaluation questions", "correct the formula") — locate and fix it precisely
- SEPARATE something (e.g. "separate advantages from disadvantages", "split types into two groups") — split into two clearly labelled sub-groups within the same sub-topic
- ADD a missing counterpart (e.g. "add disadvantages" when only advantages exist, "add merits" when only demerits exist) — insert a new labelled group directly after the existing one

CONTENT QUALITY RULES — apply to every subject:
- Every list item must have a FULL explanation a student can understand on its own — never just a word or label
  - Wrong for ANY subject: a list item that is just a word or label with nothing explaining it
  - Right (Sciences): "* **[Concept]** — [what it is, how it works, what it produces — one complete sentence]."
  - Right (Commerce/Economics): "* **[Concept]** — [definition, what it regulates or affects, real example — one complete sentence]."
  - Right (Government/Civic): "* **[Concept]** — [definition, role or function, Nigerian institutional example — one complete sentence]."
  - Right (any subject): the explanation must be long enough that a student reading it alone fully understands the concept.
- When advantages and disadvantages appear together, always present them in two separate labelled groups: **Advantages:** then **Disadvantages:**
- Do not add repeated content that already appears elsewhere in the note
- Preserve the subject's terminology — do not simplify or change technical terms

FORMATTING RULES — preserve throughout for all subjects:
- ## for major section headings (## I. ## II. ## III.)
- ### for numbered sub-topic headings inside Section II (### 1. ### 2. ### 3.)
- **Bold label** — explanation for named list items
- 1. 2. 3. numbered lists for features/functions/steps/causes/effects
- a. b. c. lettered lists for components/parts/branches/arms
- * bullet lists for examples/advantages/disadvantages/summary points
- --- dividers between every major section
- Mermaid diagram blocks and LaTeX expressions must be preserved exactly if present

Return the COMPLETE note from LESSON NOTE to the last section with the change correctly applied.

ORIGINAL NOTE:
${originalContent}`.trim();

  const model = isPremiumActive ? anthropic("claude-haiku-4-5-20251001") : groq("llama-3.3-70b-versatile");

  try {
    const response = await generateText({ model, prompt, temperature: 0.1, maxOutputTokens: 4000 });
    return {
      text: response.text.trim(),
      provider: isPremiumActive ? "claude-refiner" : "groq-refiner",
      usage: { inputTokens: response.usage.inputTokens ?? 0, outputTokens: response.usage.outputTokens ?? 0 },
    };
  } catch (err) {
    console.error("Refinement error:", err);
    throw new Error("Refinement failed.");
  }
}