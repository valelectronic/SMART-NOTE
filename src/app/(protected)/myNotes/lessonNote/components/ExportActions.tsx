"use client";

import { Download, RefreshCw, Loader2, Lock } from "lucide-react";
import { useState } from "react";

interface Props {
  generatedNote: any;
  selectedTopic: any;
  currentTerm: string;
  isPremium: boolean;
  onRegenerate: () => void;
  onDownload: () => void;
}

export function ExportActions({
  generatedNote,
  isPremium,
  onRegenerate,
  onDownload,
}: Props) {
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleDownload = async () => {
    setExportingPDF(true);
    await onDownload();
    setExportingPDF(false);
  };

  const regenerateCount = generatedNote?.regenerateCount || 0;

  // canRegenerate: premium AND hasn't used their one regeneration yet
  const regenUsed    = isPremium && regenerateCount >= 1;
  const canRegenerate = isPremium && !regenUsed;

  return (
    <div className="no-print flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">

      {/* PDF Export */}
      <button
        onClick={handleDownload}
        disabled={exportingPDF}
        className={`
          bg-primary hover:bg-primary/90 text-primary-foreground
          px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold
          flex items-center justify-center gap-2 sm:gap-3
          shadow-lg shadow-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all hover:scale-[1.02] active:scale-95
          text-xs sm:text-sm relative
          ${!isPremium ? "opacity-80 hover:opacity-100" : ""}
        `}
      >
        {exportingPDF ? (
          <>
            <Loader2 className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span>Download PDF</span>
            {!isPremium && (
              <Lock size={12} className="absolute -top-1 -right-1 text-amber-500 bg-background rounded-full p-0.5" />
            )}
          </>
        )}
      </button>

      {/* Regenerate — fully disabled once used for this topic */}
      <button
        onClick={canRegenerate ? onRegenerate : undefined}
        disabled={regenUsed}
        title={
          !isPremium       ? "Upgrade to Premium to regenerate" :
          regenUsed        ? "Already regenerated once for this topic" :
                             "Generate a new version of this note"
        }
        className={`
          px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold
          flex items-center justify-center gap-2 sm:gap-3
          text-xs sm:text-sm relative transition-all
          ${canRegenerate
            ? "border-2 border-primary text-primary hover:bg-primary/10 hover:scale-[1.02] active:scale-95 cursor-pointer"
            : "border-2 border-border text-muted-foreground opacity-50 cursor-not-allowed"
          }
        `}
      >
        <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span>Regen</span>

        {/* Lock icon — free users */}
        {!isPremium && (
          <Lock size={12} className="absolute -top-1 -right-1 text-amber-500 bg-background rounded-full p-0.5" />
        )}

        {/* "Used" badge — premium but already regenerated */}
        {regenUsed && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            Used
          </span>
        )}
      </button>

    </div>
  );
}