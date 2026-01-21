export type ParsedWeek = {
  weekNumber: number;
  topicTitle: string;
  content: string;
};

export function parseScheme(rawText: string): ParsedWeek[] {
  const lines = rawText
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean);

  const weeks: ParsedWeek[] = [];
  let currentWeek: ParsedWeek | null = null;

  for (const line of lines) {
    // Ignore headers & meta rows
    if (
      /week\s+topic/i.test(line) ||
      /scheme\s+work/i.test(line) ||
      /term/i.test(line)
    ) {
      continue;
    }

    // Split OCR table columns
    const columns = line.split(/\t|\s{2,}/).filter(Boolean);

    // Detect valid week number (ONLY 1–13)
    const weekMatch = columns[0]?.match(/^([1-9]|1[0-3])$/);

    if (weekMatch) {
      // Save previous week
      if (currentWeek) {
        currentWeek.content = currentWeek.content.trim();
        weeks.push(currentWeek);
      }

      const weekNumber = Number(weekMatch[1]);
      const topic = columns[1] ?? "Untitled Topic";
      const content = columns[2] ?? "";

      currentWeek = {
        weekNumber,
        topicTitle: normalizeOCR(topic),
        content: normalizeOCR(content),
      };

      continue;
    }

    // Append extra lines as content
    if (currentWeek) {
      currentWeek.content += " " + normalizeOCR(line);
    }
  }

  // Push last week
  if (currentWeek) {
    currentWeek.content = currentWeek.content.trim();
    weeks.push(currentWeek);
  }

  return weeks;
}


function normalizeOCR(text: string): string {
  return text
    // Remove OCR noise characters
    .replace(/[•|]/g, "")
    .replace(/[\[\]\(\)\{\}]/g, "")

    // Fix spacing issues
    .replace(/\s{2,}/g, " ")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")

    // Common *structural* OCR mistakes (not meaning)
    .replace(/\bolli\s*ine\b/gi, "online")

    .trim();
}
