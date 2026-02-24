"use client";

import { CheckCircle2, Sparkles, Zap } from "lucide-react";

interface Props {
  topic: any;
  generatedNote: any;
  cacheSource: "cache" | "ai" | null;
  loading: boolean;
  onGenerate: () => void;
}

export function TopicHeader({ topic, generatedNote, cacheSource, loading, onGenerate }: Props) {
  return (
    <div className="bg-card p-6 lg:p-8 rounded-2xl shadow-sm border border-border">
      <div className="flex flex-col gap-6">
        {/* Topic metadata */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
              Week {topic.weekNumber}
            </span>
            <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full uppercase">
              Core Topic
            </span>
            {topic.notesGenerated && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} />
                Generated
              </span>
            )}
            {generatedNote && cacheSource === "cache" && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                <Zap size={12} />
                Instant Load
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            {topic.topicTitle}
          </h1>

          {topic.topicContent && (
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
              {topic.topicContent}
            </p>
          )}
        </div>

        {/* Generate button - only show when no note exists */}
        {!generatedNote && !loading && (
          <button
            onClick={onGenerate}
            disabled={loading}
            className="
              bg-primary hover:bg-primary/90 text-primary-foreground 
              px-6 sm:px-8 py-4 rounded-xl font-bold 
              flex items-center justify-center gap-3 
              shadow-lg shadow-primary/20
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all hover:scale-[1.02] active:scale-95
              text-sm sm:text-base w-fit
            "
          >
            <Sparkles size={20} />
            <span>Generate Lesson Note</span>
          </button>
        )}

        {/* Cache info banner */}
        {generatedNote && cacheSource === "cache" && !loading && (
          <div className="no-print bg-primary/10 border-l-4 border-primary p-4 rounded-xl flex items-start gap-3">
            <Zap className="text-primary flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground mb-1">
                Previously Generated Note
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Loaded instantly - no extra cost incurred. Refine below or regenerate for a fresh version.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}