"use client";

import { Loader2, Sparkles } from "lucide-react";

interface ContentLoadingProps {
  cacheSource: "cache" | "ai" | null;
}

export function ContentLoadingSkeleton({ cacheSource }: ContentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
      <div className="relative mb-6">
        <Loader2 size={56} className="animate-spin text-primary opacity-20" />
        <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
      </div>
      
      <p className="font-bold text-foreground text-lg sm:text-xl text-center">
        {cacheSource === "cache" ? "Loading Your Note..." : "Generating Your Note..."}
      </p>
      
      <p className="text-sm sm:text-base mt-2 max-w-md text-center leading-relaxed px-4 text-muted-foreground">
        {cacheSource === "cache"
          ? "Retrieving your previously generated note."
          : "Crafting a professional, curriculum-aligned lesson note."
        }
      </p>
      
      {cacheSource !== "cache" && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4">
          {['Writing Content', 'Adding Examples', 'Formatting'].map((step, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="w-8 h-8 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className={`w-3 h-3 bg-primary rounded-full ${i === 0 ? 'animate-pulse' : ''}`} />
              </div>
              <p className="text-xs font-medium text-foreground">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarLoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
      <Loader2 className="animate-spin mb-3 text-primary" size={32} />
      <p className="text-sm font-medium">Loading scheme...</p>
    </div>
  );
}