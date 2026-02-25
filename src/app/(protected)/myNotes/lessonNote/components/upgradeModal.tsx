"use client";

import { X, Crown, FileText, Printer, Download, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  feature: string | null;
}

export function UpgradeModal({ isOpen, onClose, feature }: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  const featureMessages: Record<string, { title: string; description: string }> = {
    print: {
      title: "Print Feature Locked",
      description: "Print your lesson notes in professional format for classroom use."
    },
    download: {
      title: "PDF Export Locked",
      description: "Download high-quality PDF copies for offline access and sharing."
    },
    regenerate: {
      title: "Regeneration is Premium Only",
      description: "Generate multiple versions of the same topic for variety and comparison."
    },
    generation: {
      title: "Note Limit Reached",
      description: "You've reached your 5 free notes. Upgrade for full term generations."
    },
    refinement: {
      title: "Refinement Limit Reached",
      description: "You've used all 2 free edits. Upgrade for 5 edits per note."
    },
  };

  const currentFeature = feature ? featureMessages[feature] : null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-md shadow-2xl border border-border animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
              <Crown size={20} className="text-white sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                {currentFeature?.title || "Unlock Premium"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Get full access to all features
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feature-specific message */}
        {currentFeature && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-foreground">
              {currentFeature.description}
            </p>
          </div>
        )}

        {/* Benefits comparison */}
        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm font-bold text-foreground mb-2 sm:mb-3">Premium vs Free:</p>
          
          {/* Generation limit */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <FileText size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">Note Generations</p>
              <p className="text-xs text-muted-foreground">Free: 5 notes • Premium: 17</p>
            </div>
          </div>

          {/* Refinement limit */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Zap size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">Refinements per Note</p>
              <p className="text-xs text-muted-foreground">Free: 2 edits • Premium: 5 edits</p>
            </div>
          </div>

          {/* Regeneration */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <RefreshCw size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">Regenerate Notes</p>
              <p className="text-xs text-muted-foreground">Free: ❌ • Premium: ✓ (1x per note)</p>
            </div>
          </div>

          {/* PDF Export */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Download size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">PDF Export</p>
              <p className="text-xs text-muted-foreground">Free: ❌ • Premium: ✓ Unlimited</p>
            </div>
          </div>

          {/* Print */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Printer size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">Print Notes</p>
              <p className="text-xs text-muted-foreground">Free: ❌ • Premium: ✓ Unlimited</p>
            </div>
          </div>

          {/* AI Model */}
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Sparkles size={14} className="text-primary sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">Smart Model Quality</p>
              <p className="text-xs text-muted-foreground">Free: Basic • Premium: Advanced</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-muted/50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base sm:text-lg font-bold text-foreground">₦3000/term</p>
              <p className="text-xs text-muted-foreground">Cancel anytime</p>
            </div>
            <div className="bg-primary/10 px-2 sm:px-3 py-1 rounded-full">
              <p className="text-xs font-bold text-primary">Save 40%</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:gap-3">
          <button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl py-3 sm:py-3.5 px-4 sm:px-6 font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm sm:text-base"
            onClick={() => router.push("/pricing")}
          >
            <Crown size={16} className="sm:w-5 sm:h-5" />
            Upgrade Now
          </button>

          <button
            className="w-full border-2 border-border hover:bg-muted rounded-xl py-3 sm:py-3.5 px-4 sm:px-6 font-bold text-foreground transition-all active:scale-95 text-sm sm:text-base"
            onClick={onClose}
          >
            Maybe Later
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-3 sm:mt-4">
          Join 500+ Nigerian teachers using Premium
        </p>
      </div>
    </div>
  );
}