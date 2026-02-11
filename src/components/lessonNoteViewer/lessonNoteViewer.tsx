import React, { useEffect } from 'react';
import mermaid from 'mermaid';

// Initialize Mermaid once
mermaid.initialize({
  startOnLoad: true,
  theme: 'neutral',
  securityLevel: 'loose',
});

interface LessonNoteViewerProps {
  content: string;
  title: string;
}

export const LessonNoteViewer = ({ content, title }: LessonNoteViewerProps) => {
  
  // Every time the content changes, we tell Mermaid to "re-scan" the page
  useEffect(() => {
    mermaid.contentLoaded();
  }, [content]);

  const processContent = (rawText: string) => {
    // Claude generates mermaid diagrams inside ```mermaid blocks
    const regex = /```mermaid([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
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
        type: 'text',
        value: rawText.substring(lastIndex)
      });
    }

    return parts;
  };

  const sections = processContent(content);

  return (
    <div className="bg-card shadow-xl rounded-lg p-4 sm:p-6 md:p-8 lg:p-10 w-full mx-auto border border-border print:shadow-none print:p-0">
      
      {/* Header - Responsive */}
      <header className="border-b-2 sm:border-b-4 border-primary pb-3 sm:pb-4 mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase tracking-tight leading-tight">
          {title}
        </h1>
        <p className="text-primary font-semibold uppercase text-xs sm:text-sm mt-1 sm:mt-2">
          Ministry of Education Compliant • Official Record
        </p>
      </header>

      {/* Content - Mobile-optimized */}
      <div className="space-y-6 sm:space-y-8 text-foreground leading-relaxed">
        {sections.map((section, idx) => (
          section.type === 'mermaid' ? (
            <div 
              key={idx} 
              className="my-6 sm:my-10 flex flex-col items-center bg-muted/30 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border print:bg-white overflow-x-auto"
            >
              {/* Mermaid wrapper with horizontal scroll on mobile */}
              <div className="mermaid w-full min-w-0 overflow-x-auto flex justify-center">
                {section.value}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-3 sm:mt-4 uppercase font-bold tracking-widest">
                Technical Diagram {idx + 1}
              </p>
            </div>
          ) : (
            <div 
              key={idx} 
              className="prose prose-sm sm:prose-base lg:prose-lg prose-slate max-w-none whitespace-pre-wrap text-base sm:text-lg lg:text-xl leading-7 sm:leading-8"
            >
              {section.value}
            </div>
          )
        ))}
      </div>

      {/* Footer - Responsive */}
      <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-[10px] sm:text-xs text-muted-foreground italic">
        <span className="font-medium">Verified by SmartNote Curriculum Specialists</span>
        <span>Generated: {new Date().toLocaleDateString('en-NG')}</span>
      </footer>
    </div>
  );
};