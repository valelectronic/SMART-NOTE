import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { AlertCircle } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'system-ui, sans-serif',
  flowchart: { useMaxWidth: true, htmlLabels: false, curve: 'linear' },
});

interface LessonNoteViewerProps {
  content: string;
  title: string;
  subject?: string;
  className?: string;
}

// ─── LATEX PREPROCESSOR ──────────────────────────────────────────────────────
// Gently fixes two edge cases in AI-generated LaTeX without touching valid content:
//
// Fix 1: Missing $$\begin{aligned} opener — AI occasionally drops the opening
//   delimiter. Detected by finding a **Solution:** block whose first math line
//   contains &= but has no $$ opener immediately above it.
//
// Fix 2: Doubled inline math on Given/Required/Formula bullet lines —
//   AI writes both plain text AND $...$ e.g. "2x+3x2x+3x". Strip the duplicate.
//
// Safe for ALL subjects — both fixes are gated on patterns that only appear
// in calculation subjects (Maths, Physics, Chemistry, Accounting).

function preprocessLatex(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fix 1: detect a **Solution:** line, then check what follows
    if (line.trim() === '**Solution:**') {
      out.push(line);
      // Skip blank lines after **Solution:**
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') {
        out.push(lines[j]);
        j++;
      }
      // Check if the next non-empty line is a raw aligned math line (has &=)
      // but NOT already inside a $$ block
      if (j < lines.length) {
        const nextLine = lines[j];
        const hasAligned = nextLine.includes('&=') || nextLine.includes('&\\');
        const hasOpener = nextLine.includes('$$') || nextLine.includes('\\begin{aligned}');
        if (hasAligned && !hasOpener) {
          // Insert the missing opening delimiter
          out.push('$$');
          out.push('\\begin{aligned}');
        }
      }
      i = j - 1; // let the loop continue from j
      continue;
    }

    // Fix 2: Doubled inline math on bullet label lines
    // Pattern: "* **Given:** plaintext$math$" → "* **Given:** $math$"
    const bulletMatch = line.match(
      /^(\*\s+\*\*(?:Given|Required|Formula|Answer):\*\*\s*)([^$\n]{2,40})(\$.+)$/
    );
    if (bulletMatch) {
      const [, prefix, plainPart, mathPart] = bulletMatch;
      const plain = plainPart.replace(/\s/g, '').substring(0, 5);
      const math  = mathPart.replace(/[$\s\\{}]/g, '').substring(0, 5);
      if (plain.length > 1 && math.length > 1 && math.startsWith(plain.substring(0, 3))) {
        out.push(prefix + mathPart);
        continue;
      }
    }

    out.push(line);
  }

  return out.join('\n');
}

export const LessonNoteViewer = ({
  content,
  title,
  subject,
  className = '',
}: LessonNoteViewerProps) => {
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  useEffect(() => {
    if (!content.includes('```mermaid')) return;
    const renderMermaid = async () => {
      try {
        setMermaidError(null);
        const elements = document.querySelectorAll('.mermaid-unrendered');
        if (elements.length > 0) {
          await mermaid.run({ nodes: elements as any });
        }
      } catch (error) {
        console.error('Mermaid error:', error);
        setMermaidError('Diagram failed to render');
      }
    };
    const timer = setTimeout(renderMermaid, 150);
    return () => clearTimeout(timer);
  }, [content]);

  const processContent = (rawText: string) => {
    const fixed = preprocessLatex(rawText);
    const regex = /```mermaid([\s\S]*?)```/g;
    const parts: Array<{ type: 'markdown' | 'mermaid'; value: string }> = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(fixed)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'markdown', value: fixed.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'mermaid', value: match[1].trim() });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < fixed.length) {
      parts.push({ type: 'markdown', value: fixed.substring(lastIndex) });
    }
    return parts;
  };

  const sections = processContent(content);

  return (
    <div
      className={[
        'bg-white dark:bg-card',
        'w-full',
        'px-0 sm:px-8',
        'py-4 sm:py-8',
        'print:shadow-none print:p-0 print:border-0',
        className,
      ].join(' ')}
    >
      <header className="border-b-2 border-primary pb-3 mb-5 px-4 sm:px-0">
        <h1 className="text-base sm:text-2xl font-bold text-foreground uppercase leading-tight">
          {title}
        </h1>
        {subject && (
          <p className="text-primary font-semibold text-xs sm:text-sm mt-1">
            Subject: {subject}
          </p>
        )}
        <p className="text-primary/70 font-semibold uppercase text-[9px] sm:text-xs mt-1">
          Ministry of Education Compliant
        </p>
      </header>

      <div className="space-y-3 sm:space-y-6 text-foreground leading-relaxed">
        {sections.map((section, idx) =>
          section.type === 'mermaid' ? (
            <div
              key={idx}
              className="
                my-3 sm:my-6
                bg-muted/20 dark:bg-muted/5
                px-4 py-3 sm:p-4
                border-y sm:border sm:rounded-lg border-border
                print:bg-white print:border-gray-400
                overflow-x-auto
              "
            >
              {mermaidError ? (
                <div className="flex items-center gap-2 text-destructive text-sm py-4">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{mermaidError}</span>
                </div>
              ) : (
                <>
                  <div className="mermaid-unrendered w-full flex justify-center text-sm">
                    {section.value}
                  </div>
                  <p className="text-[9px] sm:text-xs text-muted-foreground text-center mt-2 uppercase font-bold tracking-wider">
                    Diagram
                  </p>
                </>
              )}
            </div>
          ) : (
            <div
              key={idx}
              className="
                px-4 sm:px-0
                prose prose-base
                prose-slate dark:prose-invert
                max-w-none
                prose-headings:text-foreground
                prose-headings:font-bold
                prose-h2:text-lg sm:prose-h2:text-xl
                prose-h3:text-base sm:prose-h3:text-lg
                prose-p:text-sm sm:prose-p:text-base
                prose-p:text-foreground/90
                prose-strong:text-foreground
                prose-li:text-sm sm:prose-li:text-base
                prose-li:text-foreground/90
                prose-table:text-sm
                print:prose-sm
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <table className="min-w-full text-sm" {...props} />
                    </div>
                  ),
                  code: ({ ...props }) => (
                    <code className="text-xs sm:text-sm" {...props} />
                  ),
                }}
              >
                {section.value}
              </ReactMarkdown>
            </div>
          )
        )}
      </div>

      <footer className="
        mt-8 sm:mt-12
        pt-4 sm:pt-6
        mx-4 sm:mx-0
        border-t border-border
        flex flex-col sm:flex-row
        justify-between
        gap-1 sm:gap-0
        text-[9px] sm:text-xs
        text-muted-foreground
        print:text-[9px]
      ">
        <span>SmartNote Curriculum</span>
        <span>{new Date().toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}</span>
      </footer>
    </div>
  );
};