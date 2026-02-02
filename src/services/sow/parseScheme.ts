export type ParsedWeek = {
  weekNumber: number;
  topicTitle: string;
  content: string;
};

export function parseScheme(rawText: string): ParsedWeek[] {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const weeks: ParsedWeek[] = [];
  let currentWeek: ParsedWeek | null = null;

  for (const line of lines) {
    // 1. More Lenient Week Detection (Handles "Week 1", "Wk 1", "1.", etc.)
    // Matches: 'Week 1', 'Wk 1', '1.', or just '1' at the start
    const weekMatch = line.match(/^(?:week|wk|w)?\s*(\d{1,2})(?:\.|\s|-|:|$)/i);

    if (weekMatch) {
      if (currentWeek) weeks.push(currentWeek);

      const weekNumber = Number(weekMatch[1]);
      
      // Everything after the week number is the topic/content
      const remainingText = line.replace(weekMatch[0], "").trim();

      currentWeek = {
        weekNumber,
        topicTitle: normalizeOCR(remainingText) || `Week ${weekNumber} Topic`,
        content: "",
      };
      continue;
    }

    // 2. If it's not a new week line, it's content for the current week
    if (currentWeek) {
      if (!currentWeek.topicTitle || currentWeek.topicTitle.startsWith("Week")) {
         currentWeek.topicTitle = normalizeOCR(line);
      } else {
         currentWeek.content += " " + normalizeOCR(line);
      }
    }
  }

  if (currentWeek) weeks.push(currentWeek);

  // Fallback: If no weeks were found but there is text, 
  // let's create a single entry so it doesn't just "fail"
  if (weeks.length === 0 && rawText.length > 20) {
      weeks.push({
          weekNumber: 1,
          topicTitle: "Extracted Content",
          content: normalizeOCR(rawText).substring(0, 200)
      });
  }

  return weeks;
}

function normalizeOCR(text: string): string {
  return text
    .replace(/[•|]/g, "")
    .replace(/[\[\]\(\)\{\}]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    // Add this to catch the common mistake you saw in your console
    .replace(/\bweei\b/gi, "Week") 
    .replace(/\bolli\s*ine\b/gi, "online")
    .trim();
}