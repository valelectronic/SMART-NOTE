"use client";

import { Download, Printer, RefreshCw, Loader2, Lock } from "lucide-react";
import { useState } from "react";

interface Props {
  generatedNote: any;
  selectedTopic: any;
  currentTerm: string;
  isPremium: boolean;
  printRef: React.RefObject<HTMLDivElement | null>;
  onRegenerate: () => void;
  onPrint: () => void; // ✅ Added
  onDownload: () => void; // ✅ Added
}

export function ExportActions({ 
  generatedNote, 
  isPremium, 
  onRegenerate,
  onPrint, // ✅ Added
  onDownload // ✅ Added
}: Props) {
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleDownload = async () => {
    setExportingPDF(true);
    await onDownload();
    setExportingPDF(false);
  };

  const regenerateCount = generatedNote?.regenerateCount || 0;
  const canRegenerate = isPremium && regenerateCount < 1;

  return (
    <div className="no-print flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
      {/* Print Button */}
      <button
        onClick={onPrint} // ✅ Using prop
        className={`
          bg-card hover:bg-muted text-foreground border-2 border-border
          px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold 
          flex items-center justify-center gap-2 sm:gap-3 
          transition-all hover:scale-[1.02] active:scale-95
          text-xs sm:text-sm relative
          ${!isPremium ? 'opacity-80 hover:opacity-100' : ''}
        `}
      >
        <Printer size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span>Print Note</span>
        {!isPremium && (
          <Lock size={12} className="absolute -top-1 -right-1 text-amber-500 bg-background rounded-full p-0.5" />
        )}
      </button>

      {/* PDF Export Button */}
      <button
        onClick={handleDownload} // ✅ Using prop
        disabled={exportingPDF}
        className={`
          bg-primary hover:bg-primary/90 text-primary-foreground 
          px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold 
          flex items-center justify-center gap-2 sm:gap-3 
          shadow-lg shadow-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all hover:scale-[1.02] active:scale-95
          text-xs sm:text-sm relative
          ${!isPremium ? 'opacity-80 hover:opacity-100' : ''}
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

      {/* Regenerate Button - Premium Only */}
      <button
        onClick={onRegenerate} // ✅ Using prop
        className={`
          ${canRegenerate
            ? "border-2 border-primary text-primary hover:bg-primary/10"
            : "border-2 border-border text-muted-foreground opacity-80 hover:opacity-100"
          }
          px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold 
          flex items-center justify-center gap-2 sm:gap-3 
          transition-all hover:scale-[1.02] active:scale-95
          text-xs sm:text-sm relative
        `}
      >
        <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
        <span className="hidden xs:inline">Regenerate</span>
        <span className="xs:hidden">Regen</span>
        {!isPremium && (
          <Lock size={12} className="absolute -top-1 -right-1 text-amber-500 bg-background rounded-full p-0.5" />
        )}
        {isPremium && regenerateCount >= 1 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            Used
          </span>
        )}
      </button>
    </div>
  );
}