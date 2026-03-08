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

function formatClass(raw: string): string {
  if (!raw) return "Not specified";
  const s = raw.toLowerCase().replace(/[-\s]+/g, "_");
  if (!s.includes("_")) {
    return raw.replace(/\b\w/g, c => c.toUpperCase());
  }
  const jssMatch = s.match(/jss?_?(\d)/);
  const sssMatch = !jssMatch ? s.match(/sss?_?(\d)/) : null;
  const primaryMatch = s.match(/primary_?(\d)/);
  const basicMatch = s.match(/basic_?(\d)/);
  if (jssMatch) return `JSS ${jssMatch[1]}`;
  if (sssMatch) return `SS ${sssMatch[1]}`;
  if (primaryMatch) return `Primary ${primaryMatch[1]}`;
  if (basicMatch) return `Basic ${basicMatch[1]}`;
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatTopic(raw: string): string {
  if (!raw) return "Not specified";
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
  return ["mathematics", "physics", "chemistry", "accounting", "further mathematics"].some(k => subject.toLowerCase().includes(k));
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
    return `Write 3 simple homework questions and should be in a list format. Use fill-in-the-blank or short answer. No WAEC/JAMB labels.`;
  }
  if (level === "junior") {
    return `Write 3-4 homework questions in BECE style and should be in a list format, Label each **(BECE Practice):**.`;
  }
  return `Write 3-4 questions mixing and should be in a list format:
* **(WAEC Practice):** essay question with marks, e.g. [10 marks] or
* **(NECO Practice):** essay question with marks, e.g. [10 marks]
* **(JAMB Practice):** objective question followed by indented options:
  * A) option
  * B) option
  * C) option
  * D) option`;
}

// ─── TERMINOLOGY DEPTH ───────────────────────────────────────────────────────
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
function buildHeader(ctx: any, subject: string): string {
  const school   = ctx.schoolName              ?? "Not specified";
  const cls      = formatClass(ctx.class       ?? "");
  const term     = ctx.term                    ?? "Not specified";
  const week     = ctx.week                    ?? "Not specified";
  const topic    = formatTopic(ctx.topic       ?? "");
  const teacher  = ctx.teacherName             ?? "Not specified";
  const ref      = getReference(subject, ctx.class ?? "");
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
const SUB_TOPIC_ACRONYMS = new Set([
  "cbn","ndic","sec","nafdac","inec","nass","wto","imf","vat","gdp","gnp",
  "cac","frsc","efcc","icpc","crs","irs","cbk","nnpc","firs","cbn",
]);

const MINOR_WORDS_ST = new Set([
  "a","an","the","and","but","or","for","nor","on","at","to","by","in","of","up","as","is","it",
]);

function stTitleCase(s: string): string {
  return s.trim().split(" ").map((w, i) => {
    const core = w.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
    const wl = core.toLowerCase();
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
    for (let part of parts) {
      // FIX: strip leading "and " after comma e.g. "linear equations, and substitution"
      part = part.replace(/^and\s+/i, "").trim();
      if (!part) continue;
      const andMatch = part.match(/^(.+?)\s+and\s+(.+)$/i);
      if (andMatch) {
        const left = andMatch[1].trim();
        const right = andMatch[2].trim();
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

  let headings = merged.map(stTitleCase);

  const seen = new Set<string>();
  headings = headings.filter(h => {
    const k = h.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const introKw = new Set(["introduction","meaning","definition","overview","background","concept"]);
  const hasIntro = headings.some(h => introKw.has(h.toLowerCase().split(" ")[0]));
  if (!hasIntro) headings.unshift(`Introduction to ${stTitleCase(topic)}`);

  if (!headings.some(h => h.toLowerCase().includes("summary"))) headings.push("Summary");

  return headings;
}

function buildSubTopicsBlock(raw: any, topic: string): string {
  const headings = extractSubTopics(raw, topic);
  if (headings) return headings.map((h, i) => `${i + 1}. ${h}`).join("\n");
  return "[Sub-topics will be determined by the teacher's topic description]";
}

// ─── UNIVERSAL CONTENT PATTERN ────────────────────────────────────────────────
const CONTENT_RULES = `
CONTENT QUALITY & PEDAGOGY RULES:

0. MANDATORY USER SUB-TOPICS: You MUST use the user-provided sub-topics. Develop each as a full "Teaching Step."

1. CLASSROOM INTERACTION (For the Teacher):
   For every sub-topic heading (###), include:
   - **Teacher's Activity:** [Brief action, e.g., "Demonstrates the process using a chart."]
   - **Students' Activity:** [Brief action, e.g., "Listen, observe, and ask questions."]

2. THE STUDENT NOTE (For the Students to Copy):
   - Immediately follow the Activities with a block titled: **"Note for Students:"**.
   - This section must be written in **Textbook Style**: Formal, detailed, and organized using bullet points or numbered lists.
   - It must be "self-study" ready—meaning if the student reads this at home, they fully understand the concept.

3. FORMATTING HIERARCHY:
   - ### for Sub-topic titles.
   - **Bold Labels** for definitions.
   - 1. 2. 3. for steps/processes.
   - a. b. c. for components/types.

4. NIGERIAN CONTEXT: Use Naira ($$ \text{N} $$, or the symbol ₦), Nigerian towns, and local industry examples to make it relevant.

5. NO CONVERSATIONAL FILLER: Do not say "In this section..." or "Moving on...". Write only what belongs in the teacher's record and the student's notebook.

CURRICULUM ALIGNMENT RULE:
1. AGE APPROPRIATENESS: Cross-reference the [Topic] and [Sub-topic] with the standard Nigerian NERDC curriculum for [Class Level]. 
   - Primary (Basic 1-6): Focus on identification, uses, and simple descriptions.
   - Junior Secondary (JSS 1-3): Focus on functions, characteristics, and basic processes.
   - Senior Secondary (SSS 1-3): Focus on technical definitions, complex theories, and WAEC/JAMB standards.

2. VAGUE SUB-TOPIC RESOLUTION: If a user provides a one-word sub-topic (e.g., "Uses"), do not just write general uses. Write curriculum-specific uses. 
   - Example: For "Computer" in JSS 1, focus on "Uses of ICT in daily life." 
   - Example: For "Computer" in SSS 1, focus on "Data processing and Information transmission."

3. SUBJECT THEMES: Always align content with the official NERDC themes:
   - Science: Focus on Observation and Experimentation.
   - National Values: Focus on Citizenship, Integrity, and Nigerian Constitution.
   - Vocational: Focus on Practical Skills and Entrepreneurship.


`.trim();
// ─── PROMPT BUILDERS ──────────────────────────────────────────────────────────

function buildSecondaryFreePrompt(ctx: any, headings: string[]): string {
  const subject     = ctx.subject;
  const classLevel  = ctx.class ?? "";
  const level       = getEducationLevel(classLevel);
  const header      = buildHeader(ctx, subject);
  const terminology = getTerminologyNote(subject);
  const examFocus   = level === "junior" ? "BECE/JSCE" : "WAEC/JAMB";
  const depthNote   = level === "junior"
    ? "Write for JSS students (ages 10–14). Use simple, formal English. Define every technical term the first time it appears."
    : "Write for SSS students (ages 15–18). Use correct subject terminology. Depth must be sufficient for WAEC/JAMB examinations.";

  // ── Section III scaffold ────────────────────────────────────────────────
  // Free tier: clean numbered lists per sub-topic, no KEY POINT boxes.
  // Professional enough to impress — but teachers will notice what's missing
  // (KEY POINT exam callouts, NECO questions, diagram) when they see premium.
  const sectionIII = headings.length > 0
    ? headings.map((h, i) => `
### ${i + 1}. ${h.toUpperCase()}

**Definition:** <Write one clear, precise sentence defining ${h}.>

**Explanation:**

<Write 2–3 sentences expanding on the definition. Use a Nigerian real-life example.>

**Key Points:**

1. <First important point about ${h} — write a complete sentence of at least 15 words.>
2. <Second important point — complete sentence with a specific Nigerian example where possible.>
3. <Third important point — complete sentence.>
4. <Fourth important point — complete sentence.>`
    ).join("\n\n---\n\n")
    : `<Identify 5 NERDC-approved sub-topics for ${ctx.topic}. Apply the exact scaffold above to each one.>`;

  return `You are a Nigerian Secondary School Teacher writing a formal lesson note for ${subject}.

${depthNote}

**SUBJECT TERMINOLOGY:** ${terminology}

---

## STRICT RULES — follow every one without exception:

1. **NO PEDAGOGY LABELS.** Never write "Teacher's Activity", "Students' Activity", "Note Detail", "Classroom Interaction", or "Instructional Presentation". Write content the student reads directly, like a textbook.

2. **FILL EVERY SLOT.** Every placeholder in <angle brackets> is a slot. Replace every single one with real content. Never leave angle bracket text in your output.

3. **NIGERIAN CONTEXT.** Use ₦ for all currency (never "Naira" or "N"). Reference Nigerian institutions, cities, markets, and daily life. Examples must be Nigerian — not generic or Western.

4. **NUMBERED LISTS.** Use numbered lists (1. 2. 3.) for features, functions, causes, effects. Every list item must be a complete sentence of at least 15 words. Never write bare labels or one-word items.

5. **MINIMUM LENGTH:** 700 words across the full note. If a sub-topic has natural variety (advantages AND disadvantages, types AND examples), cover both sides fully.

6. **EVALUATION:** Write 4 questions only. Do NOT provide answers. Mix one theory question and three objective questions with A/B/C/D options.

---

Write the complete lesson note now. Copy the header EXACTLY.

${header}

---

## I. PERFORMANCE OBJECTIVES

By the end of this lesson, students should be able to:

1. Define ${ctx.topic} accurately using correct subject terminology.
2. Identify and explain the key features and functions of ${ctx.topic}.
3. Apply knowledge of ${ctx.topic} to real-life Nigerian situations.
4. Answer ${examFocus} questions on ${ctx.topic} correctly.

---

## II. PREVIOUS KNOWLEDGE & INSTRUCTIONAL MATERIALS

**Entry Behaviour:** Students have previously learned about <name the immediately preceding topic in the scheme of work>. This lesson builds on that foundation.

**Instructional Materials:**
- <One specific visual aid relevant to ${subject} and this topic>
- <Textbook with chapter and page numbers>
- <One additional resource: newspaper, specimen, sample document, or chart>

---

## III. LESSON CONTENT

${sectionIII}

---

## IV. SUMMARY

<Write 3 concise bullet points summarising the most important facts from this lesson. Each bullet must be a complete sentence.>

---

## V. EVALUATION (CLASS WORK)

1. **(Theory):** <Define ${ctx.topic} and state any TWO of its functions or features.>

2. **(Objective):** <Question stem>
   - A) <option>  B) <option>  C) <option>  D) <option>

3. **(Objective):** <Question stem>
   - A) <option>  B) <option>  C) <option>  D) <option>

4. **(Objective):** <Question stem>
   - A) <option>  B) <option>  C) <option>  D) <option>

---

## VI. ASSIGNMENT

${getAssignmentRule(level)}

---

## VII. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}

---
[SYSTEM ENFORCEMENT: Before responding, scan your output and confirm:
- No angle bracket slots remain unfilled
- No pedagogy labels appear anywhere
- ₦ is used for all currency references
- Every list item is a complete sentence
- Evaluation answers are NOT provided]`;
}


export function buildSecondaryPremiumPrompt(ctx: any, headings: string[]): string {
  const subject    = ctx.subject;
  const classLevel = ctx.class ?? "";
  const level      = getEducationLevel(classLevel);
  const header     = buildHeader(ctx, subject);
  const examFocus       = level === "junior" ? "BECE/JSCE" : "WAEC/JAMB";
  const terminologyNote = getTerminologyNote(subject);
  const depthNote  = level === "junior"
    ? "Write for JSS students (ages 10–14). Simple English. Define every new term the first time it appears."
    : "Write for SSS students (ages 15–18) preparing for WAEC and JAMB. Precise terminology. Every definition must be exam-worthy.";

  // ── Section IV scaffold ───────────────────────────────────────────────────
  // Placeholders use CAPS + angle brackets so the AI knows they are SLOTS to
  // fill — not literal text to copy. Angle brackets are never valid markdown
  // so the AI cannot confuse them with formatting.
  const sectionIV = headings.length > 0
    ? headings.map((h, i) => `
### ${i + 1}. ${h.toUpperCase()}

**Definition:** <Write one precise, exam-ready sentence defining ${h}. Do NOT copy this placeholder.>

**Key Points:**

**1. <Name the first key aspect of ${h}>:** <1–2 sentences explaining it. Include a Nigerian example where applicable.>

**2. <Name the second key aspect of ${h}>:** <1–2 sentences explaining it.>

**3. <Name the third key aspect of ${h}>:** <1–2 sentences explaining it.>

> 📌 **${examFocus} KEY POINT:** <State the single most-tested examinable fact about ${h}. Be specific and direct — e.g. "The CBN was established by the CBN Act of 1958." Do NOT provide the answer to Question 5 here.>`
    ).join("\n\n---\n\n")
    : `<Identify 5 NERDC-approved sub-topics for ${ctx.topic}. Apply the exact scaffold above to each one.>`;

  return `You are a Nigerian Master Teacher with 20 years' experience writing for Longman, Evans, and Learn Africa textbooks. You have marked ${examFocus} scripts as a Chief Examiner.

Your task: write a complete, print-ready lesson note that a Nigerian teacher can photocopy and give directly to students. Quality must match "New School Mathematics", "Macmillan Geography", or "Longman Biology" textbooks.

${depthNote}

---

## ABSOLUTE RULES — violating any of these makes the note unusable:

0. **SUBJECT TERMINOLOGY:** ${terminologyNote}

1. **NO PEDAGOGY LABELS.** Never write "Teacher's Activity", "Students' Activity", "Note Detail", "Classroom Interaction", or "Instructional Presentation". Write facts for the student, not classroom narration.

2. **NIGERIAN CONTEXT IS MANDATORY.** Every example must reference Nigeria — always use ₦ for currency (never write "Naira" or "N"), cite Nigerian institutions (CBN, INEC, NNPC, NAFDAC, NSE, SMEDAN), Nigerian cities, and daily Nigerian life. A lesson on Trade references Alaba Market or Balogun Market, not Amazon.

3. **FILL EVERY SLOT.** Every placeholder written in <angle brackets> is a SLOT. Replace every single one with real content. Never leave angle bracket text in your output.

4. **EXAM-FOCUSED.** Every sub-topic must end with a > 📌 **${examFocus} KEY POINT** block. This is non-negotiable.

5. **DIAGRAM RULES.** Mermaid diagram must:
   - Use \`graph TD\` only
   - Node labels: maximum 4 words
   - NO special characters, parentheses ( ), square brackets [ ], or quotes inside node text
   - Wrap in \`\`\`mermaid ... \`\`\`

6. **TOKEN DISCIPLINE.** Complete all 9 sections. If running long, compress Section V (Summary) — never cut Sections VII or VIII.

7. **EVALUATION RULE.** Question 5 is Short Answer — write the question ONLY. Do NOT provide the answer.

---

Write the complete lesson note now. Copy the header EXACTLY — do not alter any field.

${header}

---

## I. BEHAVIOURAL OBJECTIVES

By the end of this lesson, students should be able to:

1. Define ${ctx.topic} accurately in their own words.
2. Identify and explain the key components of ${ctx.topic}.
3. Apply the knowledge of ${ctx.topic} to real-life Nigerian situations.
4. Answer ${examFocus} theory and objective questions on ${ctx.topic} correctly.
5. <Write one more measurable objective specific to this exact topic.>

---

## II. PREVIOUS KNOWLEDGE

Students have previously learned about <name the immediately preceding topic in the scheme of work>. This lesson builds directly on that foundation.

---

## III. INSTRUCTIONAL MATERIALS

- <One specific physical aid, e.g. "Wall chart showing the structure of the Nigerian Banking System">
- <Textbook reference with chapter and page numbers>
- <One additional resource: newspaper clipping, specimen, sample document, or model>

---

## IV. LESSON CONTENT

${sectionIV}

---

## V. SUMMARY

<Write maximum 3 bullet points, not paragraphs" . A student should be able to revise from these 3 points alone the night before the exam.>

---

## VI. SUMMARY DIAGRAM

\`\`\`mermaid
graph TD
<Write a simple flowchart summarising ${ctx.topic}. Max 4-word node labels. NO special characters.>
\`\`\`
*Figure 1: Visual summary of ${ctx.topic}*

---

## VII. EVALUATION (CLASS WORK)

Provide 5 questions modelled EXACTLY on ${examFocus} past question style:

1. **(${examFocus} Theory — 5 marks):** <Define or explain question — e.g. "Define ${ctx.topic} and state TWO of its functions.">

2. **(${examFocus} Theory — 5 marks):** <List/state question — e.g. "State THREE importance of ${ctx.topic} to the Nigerian economy.">

3. **(${examFocus} Objective):** <Question stem>
   - A) <option>
   - B) <option>
   - C) <option>
   - D) <option>

4. **(${examFocus} Objective):** <Question stem>
   - A) <option>
   - B) <option>
   - C) <option>
   - D) <option>

5. **(Short Answer — question ONLY, no answer):** <One direct factual recall question.>

---

## VIII. ASSIGNMENT

${getAssignmentRule(level)}

---

## IX. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}

---
[SYSTEM ENFORCEMENT: Scan your entire output before responding. If any of the following strings appear, delete them: "Teacher's Activity", "Students' Activity", "Note Detail", "Note Content Body", "Classroom Interaction", "Instructional Presentation", "Advanced Academic Detail". Also confirm: every <angle bracket slot> has been replaced with real content. Every sub-topic ends with a 📌 KEY POINT. ₦ is used for all currency — not "Naira" and not "N".]`;
}



function buildPrimaryPrompt(ctx: any, headings: string[]): string {
  const subject     = ctx.subject;
  const classLevel  = ctx.class ?? "";
  const header      = buildHeader(ctx, subject);
  const terminology = getTerminologyNote(subject);

  // Detect class level for age-appropriate language
  const classNum    = parseInt((classLevel.match(/\d/) ?? ["3"])[0], 10);
  const isLower     = classNum <= 3; // Primary 1–3: very simple, picture-based
  const ageNote     = isLower
    ? "Write for pupils aged 6–9 (Primary 1–3). Use very short sentences. Maximum 12 words per sentence. Explain everything as if talking to a child."
    : "Write for pupils aged 10–12 (Primary 4–6). Use simple but complete sentences. Build towards Basic Education Certificate Examination (BECE) readiness.";

  // ── Section III scaffold ────────────────────────────────────────────────
  // Each sub-topic: simple definition → numbered explanation points →
  // one Nigerian story/scenario. No KEY POINT boxes (that's secondary premium).
  const sectionIII = headings.length > 0
    ? headings.map((h, i) => `
### ${i + 1}. ${h.toUpperCase()}

**Meaning:** <Write one simple sentence telling pupils what ${h} means. Use words a Nigerian child already knows.>

**Explanation:**

<Write 2 simple sentences about ${h}. Use a Nigerian example — mention Olu, Zainab, Chidi, the school compound, Jollof rice, the market, or the farm.>

**Points to Know:**

1. <First point about ${h} — a complete, simple sentence of at least 12 words. Use a local Nigerian example.>
2. <Second point — complete simple sentence with a Nigerian name or place.>
3. <Third point — complete simple sentence.>

**Class Activity:** <Write one short, practical activity pupils can do at their desks or in the classroom to understand ${h}. Example: "Draw and label..." or "Write the names of three...">`
    ).join("\n\n---\n\n")
    : `<Identify 4–5 sub-topics from the NERDC Primary Curriculum for ${classLevel} on the topic "${ctx.topic}". Apply the exact scaffold above to each one.>`;

  return `You are an experienced Nigerian Primary School Teacher writing a lesson note for ${subject}, ${classLevel}.

${ageNote}

**SUBJECT TERMINOLOGY:** ${terminology}

---

## STRICT RULES — every rule must be followed:

1. **NO PEDAGOGY LABELS.** Never write "Teacher's Activity", "Pupils' Activity", "Note for Students", "Classroom Interaction", or "Instructional Presentation". Write content the pupil reads and understands directly.

2. **FILL EVERY SLOT.** Every placeholder in <angle brackets> is a slot. Replace every single one with real content. Never leave angle bracket text in your output.

3. **NIGERIAN NAMES AND EXAMPLES ARE MANDATORY.** Use Nigerian names (Olu, Zainab, Chidi, Amaka, Emeka, Fatima). Use Nigerian places (Lagos, Kano, Enugu, the school compound, Mama's shop, the market). Use ₦ for all money (never "Naira" or "N").

4. **SIMPLE SENTENCES.** Every sentence must be complete and easy to understand. ${isLower ? "Maximum 12 words per sentence for Primary 1–3." : "Maximum 18 words per sentence for Primary 4–6."}

5. **NUMBERED LISTS ONLY.** Use numbered lists (1. 2. 3.) for all points. Never use bullet points (•) or dashes (—) for main content.

6. **CLASS ACTIVITY per sub-topic.** Every sub-topic must end with one short, practical desk activity that a pupil can do without leaving their seat.

7. **EVALUATION:** Write 3 simple questions only. Use fill-in-the-blank or short answer format. Do NOT write the answers.

---

Write the complete lesson note now. Copy the header EXACTLY.

${header}

---

## I. BEHAVIOURAL OBJECTIVES

By the end of this lesson, pupils should be able to:

1. <Simple action objective — e.g. "Name THREE examples of ${ctx.topic} found in a Nigerian home.">
2. <Second objective — identify or describe something about ${ctx.topic}.>
3. <Third objective — use or apply knowledge of ${ctx.topic} in a simple way.>
4. <Fourth objective — draw, write, or state something about ${ctx.topic}.>

---

## II. PREVIOUS KNOWLEDGE & INSTRUCTIONAL MATERIALS

**Entry Behaviour:** Pupils have previously learned about <name the topic covered in the previous week>. This lesson introduces ${ctx.topic} which builds on that knowledge.

**Instructional Materials:**
- <One physical object pupils can see or touch — e.g. "Real coins and ₦ notes for counting">
- <One visual aid — e.g. "Wall chart showing types of ${ctx.topic}">
- <One everyday Nigerian object relevant to this lesson>

---

## III. LESSON CONTENT

${sectionIII}

---

## IV. SUMMARY

<Write 3 simple sentences telling pupils the most important things they learned today. Start each sentence with "Remember that...">

---

## V. EVALUATION (CLASS WORK)

1. <Fill-in-the-blank or short answer question about ${ctx.topic}.>
2. <Fill-in-the-blank or short answer question — use a Nigerian name or example.>
3. <Simple question asking pupils to name or list ONE thing from the lesson.>

---

## VI. ASSIGNMENT

${getAssignmentRule("primary")}

---

## VII. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}

---
[SYSTEM ENFORCEMENT: Before responding, scan your output and confirm:
- No angle bracket slots remain unfilled
- No pedagogy labels appear (Teacher's Activity, Pupils' Activity, Note for Students, Instructional Presentation)
- ₦ is used for all money — never "Naira" or "N"
- Every sub-topic ends with a Class Activity
- Evaluation answers are NOT provided
- All names used are Nigerian names]`;
}



function buildCalculationPrompt(ctx: any, headings: string[] = []): string {
  const subject    = ctx.subject;
  const classLevel = ctx.class ?? "";
  const level      = getEducationLevel(classLevel);
  const header     = buildHeader(ctx, subject);
  const isMaths    = ["mathematics", "further mathematics"].includes(normalizeSubject(subject));
  const examFocus  = level === "junior" ? "BECE/JSCE" : "WAEC/JAMB";

  // Dynamic example budget — more sub-topics = fewer examples each.
  // Prevents token exhaustion: the note must always reach Assignment + References.
  const topicCount = headings.length || 5;
  // Token budget per sub-topic (Gold Standard example ≈ 250 tokens each):
  // 6000 output tokens − 600 fixed sections = 5400 for content
  // 6 topics × 250t/example = budget for ~3 per topic max, but derivation adds ~150t each
  // So: 6 topics × (150 + 2×250) = 3900   vs  6 × (150 + 3×250) = 5400  (tight)
  const exCount    = topicCount <= 2
    ? (isMaths ? "3" : "2–3")   // 1–2 sub-topics: generous
    : topicCount <= 3
      ? (isMaths ? "2–3" : "2") // 3 sub-topics: comfortable
      : topicCount === 4
        ? "2"                    // exactly 4 sub-topics: 2 examples
        : "1";                   // 5+ sub-topics: exactly 1 — completeness over quantity

  const depthNote = level === "junior"
    ? "Write for JSS students (ages 10–14). Use simple language. Define every symbol and unit the first time it appears."
    : "Write for SSS students (ages 15–18) preparing for WAEC and JAMB. Every worked example must be detailed enough for a student to follow without a teacher.";

  // ── Section III scaffold ─────────────────────────────────────────────────
  // Each sub-topic: definition → formula derivation → worked examples.
  // The Gold Standard block is pre-written ONCE in the prompt as a pattern,
  // and the scaffold slots tell the AI exactly how many examples to write
  // and what Nigerian context to embed.
  const sectionIII = headings.length > 0
    ? headings.map((h, i) => `
### ${i + 1}. ${h.toUpperCase()}

**Definition:** <Write one precise sentence defining ${h}. Include SI units where applicable.>

**Derivation / Principle:**

<Write 1–2 sentences only. State the key principle or formula origin with ONE Nigerian context reference. Be concise — token budget is tight.>

**Key Formula:**

$$\\boxed{\\text{<write the primary formula for ${h} here — e.g. } T_n = a + (n-1)d \\text{>}}$$

**Where:**
- $<symbol>$ = <meaning with SI unit>
- $<symbol>$ = <meaning with SI unit>
- $<symbol>$ = <meaning with SI unit>

**Worked Examples:**

<Write EXACTLY ${exCount} worked examples for ${h}. Follow the GOLD STANDARD FORMAT below. No more, no fewer.>`
    ).join("\n\n---\n\n")
    : `<Identify 5–6 NERDC-approved sub-topics for ${ctx.topic} in ${classLevel}. Apply the exact scaffold above to each one, with ${exCount} worked examples per sub-topic.>`;

  return `You are a Nigerian Master Teacher and ${examFocus} Chief Examiner for ${subject} with 20 years' experience writing for Macmillan, Evans, and Lamlad textbooks.

Your task: write a complete, print-ready lesson note that a Nigerian teacher can use directly in class. Every worked example must be detailed enough that a student can follow all steps without a teacher present.

${depthNote}

**SUBJECT TERMINOLOGY:** ${getTerminologyNote(subject)}

---

## THE GOLD STANDARD — copy this structure for EVERY worked example, no exceptions:

### Example [n]: [Short descriptive title — e.g. "Calculating Kinetic Energy of a Moving Bus"]

* **Given:** $[all values with units — e.g. $m = 1200\\text{ kg}$, $v = 20\\text{ m/s}$]$
* **Required:** $[what to find — e.g. $KE$]$
* **Formula:** $[general formula — e.g. $KE = \\frac{1}{2}mv^2$]$

**Solution:**

⚠️ MANDATORY: Wrap the entire solution in $$ ... $$. The structure MUST be:
$$
\\begin{aligned}
[first line: substitute values] &= [result] \\\\
[second line: simplify] &= [result] \\\\
[final line: state answer with unit] &= [final value]
\\end{aligned}
$$
NEVER write \\begin{aligned} without the $$ before and after it.
**Answer:** $\\boxed{[final answer with units]}$

> 💡 **Examiner's Note:** <One sentence telling the student the common mistake candidates make on this type of question in ${examFocus} — e.g. "Many candidates forget to square the velocity — always apply the formula before substituting.">

---

## ABSOLUTE RULES — violating any of these makes the note unusable:

1. **EXAMPLE COUNT IS ABSOLUTE — CHECK BEFORE WRITING EACH SUB-TOPIC.**
   - You have been allocated EXACTLY ${exCount} worked example(s) per sub-topic.
   - Before writing Example 1 of each sub-topic, say to yourself: "I will write ${exCount} example(s) for this sub-topic, then stop."
   - After finishing the last allowed example, move immediately to the next sub-topic.
   - Writing even ONE extra example WILL cause the note to truncate and become unusable.
   - A note with ${exCount} complete examples per sub-topic is worth FAR MORE than a note with 3 examples that cuts off.

2. **COMPLETE ALL SECTIONS — THIS OVERRIDES EVERYTHING.**
   - The note MUST contain Sections I through VII. All of them. No exceptions.
   - After completing EACH sub-topic, count: "I have finished [n] of [total] sub-topics. Do I have enough space to finish all remaining sub-topics plus Sections IV–VII?" If no — immediately shorten all remaining sub-topics.
   - The order of sacrifice: (1) shorten Derivation to 1 sentence → (2) cut Examiner's Note to 1 line → (3) trim Definition to 1 line. NEVER skip Evaluation, Assignment, or References.
   - If you finish the last sub-topic and have not written Sections IV–VII, write them immediately — even in compressed form.

3. **NO PEDAGOGY LABELS.** Never write "Teacher's Activity", "Students' Activity", "Note Detail", or "Instructional Presentation". Write content the student reads directly.

4. **FILL EVERY SLOT.** Every placeholder in <angle brackets> is a slot. Replace every single one with real content. Never leave angle bracket text in your output.

5. **GOLD STANDARD IS MANDATORY.** Every worked example must follow the Gold Standard: Given → Required → Formula → Solution block → Boxed Answer → Examiner's Note. No exceptions.

6. **LaTeX RULES:**
   - All maths must be in LaTeX: $inline$ or $$display$$
   - Every solution block must use $$\\begin{aligned} ... \\end{aligned}$$
   - Line breaks inside aligned block: \\\\ (two backslashes — renders as newline in LaTeX)
   - Multiplication: $a \\times b$ — never * or the letter x
   - Fractions: $\\frac{a}{b}$ — never a/b in plain text
   - Units must be in text mode: $20\\text{ m/s}$ not $20 m/s$
   - Chemical formulas: use subscripts and superscripts — $\\text{H}_2\\text{SO}_4$, $\\text{Ca}^{2+}$, $\\text{CO}_3^{2-}$
   - Never use plain text like "H2SO4" — always use proper LaTeX notation

7. **NIGERIAN CONTEXT IS MANDATORY.** Every worked example must use Nigerian values:
   - Physics: Kainji Dam, NEPA/PHCN bills, Lagos-Ibadan Expressway, Nnamdi Azikiwe Airport
   - Chemistry: NNPC refinery, water from River Niger, limestone from Ewekoro
   - Maths: Olu's salary in ₦, Zainab's farm in hectares, distances between Nigerian cities
   - Always use ₦ for money (never "Naira" or "N")

8. **EXAMINER'S NOTE per example.** Every worked example must end with a > 💡 **Examiner's Note** stating the most common candidate mistake on that question type.

---

Write the complete lesson note now. Copy the header EXACTLY.

${header}

---

## I. BEHAVIOURAL OBJECTIVES

By the end of this lesson, students should be able to:

1. <State and define the key formula(s) for ${ctx.topic} with correct SI units.>
2. <Derive or explain the mathematical basis of ${ctx.topic} from first principles.>
3. <Solve ${examFocus} standard problems on ${ctx.topic} showing all working steps.>
4. <Apply ${ctx.topic} to real-life Nigerian engineering or everyday situations.>
5. Answer ${examFocus} theory and objective questions on ${ctx.topic} correctly.

---

## II. PREVIOUS KNOWLEDGE & INSTRUCTIONAL MATERIALS

**Entry Behaviour:** Students have previously learned about <name the immediately preceding topic in the scheme of work>. This lesson builds on that foundation.

**Instructional Materials:**
- <One specific laboratory apparatus or physical demonstration tool>
- <Textbook with chapter and page numbers>
- <One real Nigerian object or data source — e.g. "PHCN electricity bill showing units consumed", "road distance chart between Lagos and Abuja">

---

## III. LESSON CONTENT

${sectionIII}

---

## IV. PRACTICE PROBLEMS

Attempt the following without looking at the worked examples:

1. <Calculation problem at easy level — give all values, ask for one unknown. Nigerian context required.> *(Answer: $\\boxed{<answer with units>}$)*
2. <Calculation problem at medium level — Nigerian context required.> *(Answer: $\\boxed{<answer with units>}$)*
3. <Calculation problem at hard level — ${examFocus} past question style. Nigerian context required.> *(Answer: $\\boxed{<answer with units>}$)*

---

## V. EVALUATION (CLASS WORK)

1. **(${examFocus} Theory — 5 marks):** <Define ${ctx.topic} and state the formula with all symbols explained.>
2. **(${examFocus} Calculation — 10 marks):** <A two-step calculation problem in Nigerian context. Do NOT provide the answer here.>
3. **(${examFocus} Objective):** <Question stem>
   - A) $<option>$  B) $<option>$  C) $<option>$  D) $<option>$
4. **(${examFocus} Objective):** <Question stem>
   - A) $<option>$  B) $<option>$  C) $<option>$  D) $<option>$

---

## VI. ASSIGNMENT

${getAssignmentRule(level)}

---

## VII. REFERENCE BOOKS

${getAllReferences(subject, classLevel)}

---
[SYSTEM ENFORCEMENT: Before responding, scan your output and confirm:
- No angle bracket slots remain unfilled
- No pedagogy labels appear anywhere
- Every worked example follows Gold Standard: Given → Required → Formula → aligned Solution → Boxed Answer → Examiner's Note
- Every $$\\begin{aligned} block is properly closed with \\end{aligned}$$
- ₦ used for all currency
- All examples use Nigerian context]`;
}


// ─── PROMPT SELECTOR ─────────────────────────────────────────────────────────
function getSystemPrompt(ctx: any, isPremium: boolean, headings: string[]): string {
  const subject = ctx.subject ?? "";
  const classLevel = ctx.class ?? "";
  const level = getEducationLevel(classLevel);

  if (level === "primary") return buildPrimaryPrompt(ctx, headings);
  if (isCalculationSubject(subject, classLevel)) return buildCalculationPrompt(ctx, headings);
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

  const resolvedHeadings = extractSubTopics(context.subTopics, context.topic ?? "");
  const headingsForPrompt = resolvedHeadings ?? [];
  const systemPrompt = getSystemPrompt(context, isPremium, headingsForPrompt);

  const userPrompt = `Write the complete lesson note for the topic: "${context.topic}". Follow all instructions in your system prompt exactly. Start with LESSON NOTE immediately.`.trim();

  if (isPremium) {
    try {
      const response = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: isCalculationSubject(context.subject, context.class) ? 0.1 : 0.2,
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