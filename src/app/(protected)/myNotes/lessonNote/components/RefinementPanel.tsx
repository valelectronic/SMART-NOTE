"use client";

import { Send, Clock, Sparkles, Loader2 } from "lucide-react";

interface Props {
  generatedNote: any;
  instruction: string;
  setInstruction: (value: string) => void;
  loading: boolean;
  isPremium: boolean;
  onRefine: () => void;
}

export function RefinementPanel({ generatedNote, instruction, setInstruction, loading, isPremium, onRefine }: Props) {
  const editLimit = isPremium ? 3 : 2;
  const isEditLimitReached = generatedNote.editCount >= editLimit;

  return (
    <div className="no-print bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-slate-700">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Send size={24} className="text-primary" />
            </div>
            <span>Refine This Note</span>
          </h3>
          <span className="bg-white/5 px-4 py-2 rounded-xl text-sm font-mono border border-white/10">
            <span className="text-slate-400">Edits:</span>{' '}
            <span className={isEditLimitReached ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
              {generatedNote.editCount}/{editLimit}
            </span>
          </span>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
          <Clock className="text-primary flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-slate-100 leading-relaxed">
            <p className="font-bold mb-1">Your Limits:</p>
            <ul className="space-y-1 text-xs">
              <li>• Refinements: {generatedNote.editCount}/{editLimit} used</li>
              <li>• Cooldown: {isPremium ? '2' : '5'} minutes between edits</li>
              <li>• Regenerate: {isPremium
                ? (generatedNote.regenerateCount || 0) >= 1
                  ? '✓ Already used (1/1)'
                  : '✓ Available (0/1)'
                : '✗ Premium only'}
              </li>
            </ul>
          </div>
        </div>

        {/* Instruction Input */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-300">
            What would you like to improve?
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Examples:&#10;• 'Add Lagos State examples'&#10;• 'Simplify Step 3'&#10;• 'Include WAEC 2022 questions'"
            className="
              w-full bg-white/5 border border-white/10 rounded-xl 
              p-4 sm:p-5 text-white placeholder:text-white/30 
              focus:outline-none focus:ring-2 focus:ring-primary/50 
              min-h-[140px] sm:min-h-[160px] transition-all
              text-sm sm:text-base leading-relaxed
            "
            maxLength={500}
          />
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Be specific for best results</span>
            <span>{instruction.length}/500</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRefine}
            disabled={loading || !instruction.trim() || isEditLimitReached}
            className="
              bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold 
              hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500
              transition-all flex items-center justify-center gap-3 
              shadow-lg active:scale-95
              disabled:cursor-not-allowed
              text-sm sm:text-base
            "
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Apply Correction</span>
              </>
            )}
          </button>

          {isEditLimitReached && (
            <button className="
              bg-gradient-to-r from-amber-500 to-orange-500 
              text-white px-8 py-4 rounded-xl font-bold 
              hover:from-amber-600 hover:to-orange-600
              transition-all flex items-center justify-center gap-3 
              shadow-lg active:scale-95
              text-sm sm:text-base
            ">
              <Sparkles size={20} />
              <span>Upgrade to Premium</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}