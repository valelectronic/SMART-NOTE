import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { AlertCircle } from 'lucide-react';

// ✅ Optimized Mermaid config - lighter, faster
mermaid.initialize({
  startOnLoad: false, // Manual control for better performance
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: false, // Faster rendering
    curve: 'linear' // Simpler curves = faster
  }
});

interface LessonNoteViewerProps {
  content: string;
  title: string;
  subject?: string;
  className?: string;
}

export const LessonNoteViewer = ({ 
  content, 
  title, 
  subject,
  className = '' 
}: LessonNoteViewerProps) => {
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Only render if mermaid exists
    if (!content.includes('```mermaid')) return;

    const renderMermaid = async () => {
      try {
        setMermaidError(null);
        // ✅ Manual rendering for better control
        const elements = document.querySelectorAll('.mermaid-unrendered');
        if (elements.length > 0) {
          await mermaid.run({ nodes: elements as any });
        }
      } catch (error) {
        console.error('Mermaid error:', error);
        setMermaidError('Diagram failed to render');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderMermaid, 150);
    return () => clearTimeout(timer);
  }, [content]);

  const processContent = (rawText: string) => {
    const regex = /```mermaid([\s\S]*?)```/g;
    const parts: Array<{ type: 'markdown' | 'mermaid'; value: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'markdown',
          value: rawText.substring(lastIndex, match.index)
        });
      }
      parts.push({ 
        type: 'mermaid', 
        value: match[1].trim() 
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < rawText.length) {
      parts.push({ 
        type: 'markdown', 
        value: rawText.substring(lastIndex) 
      });
    }

    return parts;
  };

  const sections = processContent(content);

  return (
    <div className={`
      bg-white dark:bg-card 
      shadow-lg rounded-lg 
      p-4 sm:p-8 
      w-full mx-auto 
      border border-border 
      print:shadow-none print:p-0 print:border-0
      ${className}
    `}>
      {/* Header */}
      <header className="border-b-2 border-primary pb-3 mb-6 print:mb-4">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground uppercase leading-tight">
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

      {/* Content */}
      <div className="space-y-4 sm:space-y-6 text-foreground leading-relaxed">
        {sections.map((section, idx) => (
          section.type === 'mermaid' ? (
            <div 
              key={idx} 
              className="
                my-4 sm:my-6
                bg-muted/20 dark:bg-muted/5
                p-3 sm:p-4
                rounded-lg
                border border-border 
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
                  {/* ✅ Optimized Mermaid container */}
                  <div className="mermaid-unrendered w-full flex justify-center text-sm sm:text-base">
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
                prose prose-sm sm:prose-base 
                prose-slate dark:prose-invert 
                max-w-none
                prose-headings:text-foreground 
                prose-headings:font-bold
                prose-h2:text-base sm:prose-h2:text-xl
                prose-h3:text-sm sm:prose-h3:text-lg
                prose-p:text-sm sm:prose-p:text-base
                prose-p:text-foreground/90
                prose-strong:text-foreground
                prose-li:text-sm sm:prose-li:text-base
                prose-li:text-foreground/90
                prose-table:text-sm sm:prose-table:text-base
                print:prose-sm
              "
            >
              <ReactMarkdown 
                remarkPlugins={[remarkMath]} 
                rehypePlugins={[rehypeKatex]}
                components={{
                  table: ({...props}) => (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <table className="min-w-full text-sm" {...props} />
                    </div>
                  ),
                  code: ({...props}) => (
                    <code className="text-xs sm:text-sm" {...props} />
                  )
                }}
              >
                {section.value}
              </ReactMarkdown>
            </div>
          )
        ))}
      </div>

      {/* Footer */}
      <footer className="
        mt-8 sm:mt-12
        pt-4 sm:pt-6
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
          day: 'numeric'
        })}</span>
      </footer>
    </div>
  );
};