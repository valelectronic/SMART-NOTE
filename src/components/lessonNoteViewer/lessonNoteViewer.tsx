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
    <div className="bg-white shadow-xl rounded-lg p-10 max-w-4xl mx-auto border border-gray-200 print:shadow-none print:p-0">
      <header className="border-b-4 border-blue-700 pb-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-tight">{title}</h1>
        <p className="text-blue-700 font-semibold uppercase text-sm mt-1">
          Ministry of Education Compliant • Official Record
        </p>
      </header>

      <div className="space-y-8 text-gray-800 leading-relaxed">
        {sections.map((section, idx) => (
          section.type === 'mermaid' ? (
            <div key={idx} className="my-10 flex flex-col items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-white">
              <div className="mermaid w-full flex justify-center">
                {section.value}
              </div>
              <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                Technical Diagram {idx + 1}
              </p>
            </div>
          ) : (
            <div key={idx} className="prose prose-blue max-w-none whitespace-pre-wrap font-serif text-xl leading-8">
              {section.value}
            </div>
          )
        ))}
      </div>

      <footer className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 italic">
        <span>Verified by SmartNote Curriculum Specialists</span>
        <span>Generated: {new Date().toLocaleDateString('en-NG')}</span>
      </footer>
    </div>
  );
};