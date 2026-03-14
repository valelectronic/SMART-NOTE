"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { toast } from "sonner";
import { LessonNoteViewer } from "@/components/lessonNoteViewer/lessonNoteViewer";
import { LessonNoteSidebar } from "./components/lessonNoteSidebar";
import { TopicHeader } from "./components/topicHeader";
import { ExportActions } from "./components/ExportActions";
import { RefinementPanel } from "./components/RefinementPanel";
import { EmptyState } from "./components/EmptyState";
import { UpgradeModal } from "./components/upgradeModal";

function NoteLoadingSkeleton() {
  return (
    <div className="space-y-3 py-6" aria-label="Loading…">
      <div className="h-4 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-5/6" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-4 bg-muted rounded w-4/5" />
    </div>
  );
}

function EditLimitBanner({ onReset, isResetting }: { onReset: () => void; isResetting: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-muted-foreground leading-snug">
        You&rsquo;ve reached the refinement limit for this note. Try generating
        a new sub-topic, or reset to the original version — it&rsquo;s already looking great.
      </p>
      <button
        onClick={onReset}
        disabled={isResetting}
        className="shrink-0 text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isResetting ? "Resetting…" : "Reset to original"}
      </button>
    </div>
  );
}

export default function LessonNotePage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [generatedNote, setGeneratedNote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [instruction, setInstruction] = useState("");
  const [currentTerm, setCurrentTerm] = useState<string>("First Term");
  const [cacheSource, setCacheSource] = useState<"cache" | "ai" | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [previousNote, setPreviousNote] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);
  const [editLimitReached, setEditLimitReached] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const printRef = useRef<HTMLDivElement | null>(null);

  // ─── Load topics + premium status ────────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const topicsRes = await fetch("/api/scheme/topics");
        if (!topicsRes.ok) throw new Error("Topics API failed");
        const topicsData = await topicsRes.json();

        let isPremiumStatus = false;
        try {
          const premiumRes = await fetch("/api/generate-lesson-note/premium-status");
          if (premiumRes.ok) {
            const premiumData = await premiumRes.json();
            isPremiumStatus =
              premiumData.isPremium ||
              ["premium", "school"].includes(premiumData.subscriptionTier || "") ||
              premiumData.approvalStatus === "approved" ||
              false;
          }
        } catch {
          console.warn("Premium check failed — defaulting to free");
        }

        if (Array.isArray(topicsData)) {
          setWeeks(topicsData);
          if (topicsData[0]?.term) setCurrentTerm(topicsData[0].term);
        } else {
          toast.error("Could not load your topics. Please refresh.");
        }

        setIsPremium(isPremiumStatus);
      } catch (err: any) {
        console.error("Init error:", err);
        toast.error("Failed to load. Please refresh the page.");
      } finally {
        setInitialFetchLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // ─── Load note when topic changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedTopic?.id) return;
    if (generatedNote?.schemeSubTopicId === selectedTopic.id) return;

    const fetchExistingNote = async () => {
      try {
        setLoading(true);
        setPreviousNote(null);
        setIsRefining(false);
        setEditLimitReached(false);

        const res = await fetch(`/api/generate-lesson-note/${selectedTopic.id}`, {
          credentials: "include",
        });

        if (res.status === 404) { setGeneratedNote(null); setCacheSource(null); return; }
        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();
        if (data.note) { setGeneratedNote(data.note); setCacheSource("cache"); }
        else { setGeneratedNote(null); setCacheSource(null); }
      } catch (err: any) {
        console.error("Fetch error:", err);
        toast.error("Could not load note. Try selecting the topic again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExistingNote();
  }, [selectedTopic?.id]);

  useEffect(() => { setEditLimitReached(false); }, [selectedTopic?.id]);

  // ─── Premium gate ─────────────────────────────────────────────────────────
  const handlePremiumAction = (action: () => void, feature: string) => {
    if (!isPremium) {
      setLockedFeature(feature);
      setShowUpgradeModal(true);
      return;
    }
    action();
  };

  // ─── Reset to original ────────────────────────────────────────────────────
  const handleResetToOriginal = async () => {
    if (!generatedNote?.originalContent) {
      toast.error("No original version found for this note.");
      return;
    }
    if (generatedNote.content === generatedNote.originalContent) {
      toast.info("This note is already at its original version.");
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch(`/api/lesson-note/${generatedNote.id}/reset`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Reset failed");
      }
      const data = await res.json();
      setGeneratedNote((prev: any) => ({
        ...prev,
        content: prev.originalContent,
        editCount: 0,
        ...(data.note ?? {}),
      }));
      setEditLimitReached(false);
      toast.success("Note reset to original version.");
    } catch (err: any) {
      console.error("Reset error:", err);
      toast.error(err.message || "Could not reset note. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  // ─── Generate / refine / regenerate ──────────────────────────────────────
  const handleGenerate = async (isRefinement = false, forceRegenerate = false) => {
    if (!selectedTopic?.id) return;

    setLoading(true);
    const toastId = isRefinement ? "refining" : "generating";

    if (isRefinement && generatedNote) {
      setIsRefining(true);
      setPreviousNote(generatedNote);
      toast.loading("Updating your note…", { id: toastId });
    } else if (forceRegenerate) {
      toast.loading("Rewriting note…", { id: toastId });
    } else {
      toast.loading("Creating lesson note…", { id: toastId });
    }

    try {
      const res = await fetch("/api/generate-lesson-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subTopicId: selectedTopic.id,
          instruction: isRefinement ? instruction : undefined,
          forceRegenerate,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        switch (result.code) {
          case "LIMIT_REACHED":
            toast.error("You've reached your note limit", { id: toastId, description: result.error, duration: 5000 });
            setLockedFeature("generation");
            setShowUpgradeModal(true);
            break;
          case "PREMIUM_REQUIRED":
            toast.error("Upgrade to rewrite notes", { id: toastId, description: "Regeneration is available on Premium plans.", duration: 4000 });
            setLockedFeature("regenerate");
            setShowUpgradeModal(true);
            break;
          case "REGENERATE_LIMIT":
            toast.error("Already rewritten once", { id: toastId, description: "Use the refinement box below to keep improving this note.", duration: 4000 });
            break;
          case "EDIT_LIMIT":
            toast.dismiss(toastId);
            setEditLimitReached(true);
            if (!isPremium) { setLockedFeature("refinement"); setShowUpgradeModal(true); }
            break;
          case "COOLDOWN":
            toast.error("Please wait a moment", { id: toastId, description: result.error, duration: 4000 });
            break;
          default:
            toast.error(result.error || "Something went wrong. Please try again.", { id: toastId, duration: 4000 });
        }
        if (isRefinement && previousNote) setGeneratedNote(previousNote);
        setIsRefining(false);
        setPreviousNote(null);
        return;
      }

      if (result.status === "success") {
        setGeneratedNote(result.data);
        setCacheSource(result.source ?? "ai");
        setIsRefining(false);
        setPreviousNote(null);
        setEditLimitReached(false);

        if (isRefinement) {
          setInstruction("");
          toast.success("Note updated", { id: toastId, duration: 2500 });
        } else if (forceRegenerate) {
          toast.success("Note rewritten", { id: toastId, duration: 2500 });
        } else {
          toast.success("Lesson note ready", { id: toastId, duration: 2500 });
        }

        if (result.usedPremiumTrial) {
          toast.info("Free trial used", { description: "Upgrade for unlimited notes and edits.", duration: 5000 });
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      if (isRefinement && previousNote) setGeneratedNote(previousNote);
      setIsRefining(false);
      setPreviousNote(null);
      toast.error("Connection error", { id: toastId, description: "Check your internet and try again.", duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  // ─── PDF export ──────────────────────────────────────────────────────────
  // Uses window.open + browser native print (not html2canvas) to avoid oklch crash.
  // @page { margin: 0mm } suppresses the browser's auto-added URL/date/title.
  // Body padding compensates so content still has margins on the page.
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    const toastId = "pdf-export";
    toast.loading("Preparing PDF...", { id: toastId });

    try {
      const katexHref =
        Array.from(document.styleSheets)
          .map(s => { try { return s.href ?? ""; } catch { return ""; } })
          .find(h => h.includes("katex")) ?? "";

      const paperHTML = printRef.current.innerHTML;
      const title = selectedTopic?.topicTitle ?? "Lesson Note";

      const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isMobile  = isIOS || isAndroid;

      const printWindow = window.open("", "_blank", "width=900,height=650");
      if (!printWindow) {
        toast.error(
          "Pop-up blocked. Tap the menu in your browser → Settings → Pop-ups → Allow for this site.",
          { id: toastId, duration: 8000 }
        );
        return;
      }

      // Platform-specific instructions — shown only on mobile, hidden when printing
      const mobileBanner = isMobile ? `
        <div class="mobile-banner">
          <div class="banner-title">📄 Your document is ready</div>
          <div class="banner-steps">
            ${isIOS
              ? `<span>On iPhone/iPad: tap the <strong>Share icon</strong> (box with arrow) at the bottom → <strong>Print</strong> → pinch outward on the preview to save as PDF</span>`
              : `<span>On Android: tap the <strong>⋮ three-dot menu</strong> → <strong>Share</strong> → <strong>Print</strong> → tap the PDF icon to save</span>`
            }
          </div>
          <button id="print-btn" class="banner-btn" onclick="window.print()" disabled style="opacity:0.5;cursor:not-allowed;">
            ⏳ Loading equations...
          </button>
        </div>` : "";

      // Extract KaTeX enabler script to a variable to avoid TypeScript
      // template-literal type errors and keep the HTML string clean.
      // btn null-check is inside the script string — safe at runtime.
      const katexLoadScript = (isMobile && katexHref) ? `
  <script>
    (function() {
      var btn = document.getElementById('print-btn');
      if (!btn) return;
      var katexLink = document.querySelector('link[href*="katex"]');
      function enableBtn() {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.textContent = 'Open Print / Save as PDF';
      }
      if (!katexLink) { enableBtn(); return; }
      if (katexLink.sheet) { enableBtn(); return; }
      katexLink.addEventListener('load', enableBtn);
      setTimeout(enableBtn, 2000);
    })();
  <\/script>` : '';

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  ${katexHref ? `<link rel="stylesheet" href="${katexHref}"/>` : ""}
  <style>
    @page { size: A4; margin: 0mm; }

    /* ── Screen styles (mobile preview) ── */
    @media screen {
      body { max-width: 780px; margin: 0 auto; padding: 16px; }
    }

    /* ── Print / PDF styles ── */
    @media print {
      .mobile-banner { display: none !important; }
      h1, h2, h3 { page-break-after: avoid; }
      p, li { orphans: 3; widows: 3; }
      section, .section { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
    }

    /* ── Base styles (screen + print) ── */
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      /* System font stack — never fails to load, looks native on every device */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      background: #ffffff;
      padding: 18mm 16mm;
      margin: 0;
    }
    h1 { font-size: 20px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 6px; }
    h2 { font-size: 16px; font-weight: 700; margin: 18px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    h3 { font-size: 13px; font-weight: 700; margin: 12px 0 4px; }
    p  { margin: 5px 0; }
    ul, ol { margin: 5px 0 5px 20px; }
    li { margin: 3px 0; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 5px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
    blockquote { border-left: 3px solid #ccc; margin: 6px 0; padding: 4px 12px; color: #555; }
    code { font-family: "Courier New", Courier, monospace; font-size: 11px; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
    pre { background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 8px 0; }
    .katex-display { margin: 10px 0; padding: 6px 12px; background: #f8fafc; border-radius: 4px; }
    .no-print { display: none !important; }

    /* ── Mobile banner styles ── */
    .mobile-banner {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #1d4ed8;
      color: #fff;
      padding: 14px 16px;
      margin: -18mm -16mm 24px -16mm;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .banner-title {
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 6px;
    }
    .banner-steps {
      font-size: 13px;
      opacity: 0.92;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    .banner-btn {
      display: inline-block;
      background: #ffffff;
      color: #1d4ed8;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      /* User-initiated click — higher browser permission than auto print() */
    }
    .banner-btn:active { opacity: 0.85; }
  </style>
</head>
<body>
  \${mobileBanner}
  \${paperHTML}
  \${katexLoadScript}
</body>
</html>`);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          try {
            if (isMobile) {
              // Mobile: document is fully visible — user uses OS native flow
              // The "Open Print / Save as PDF" button in the banner is a
              // user-initiated click which has higher browser permission
              toast.success("Document ready — follow the instructions in the blue bar to save as PDF", { id: toastId, duration: 6000 });
            } else {
              // Desktop: auto-trigger print dialog
              printWindow.focus();
              printWindow.print();
              toast.success("Print dialog opened — select 'Save as PDF'", { id: toastId, duration: 4000 });
              setTimeout(() => printWindow.close(), 2000);
            }
          } catch (e) {
            console.error(e);
            toast.error("Use your browser menu to print.", { id: toastId });
          }
        }, 500);
      };

    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF failed. Please try again.", { id: toastId });
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LessonNoteSidebar
        weeks={weeks}
        selectedTopic={selectedTopic}
        onSelectTopic={setSelectedTopic}
        currentTerm={currentTerm}
        loading={initialFetchLoading}
      />

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-10">
          <Suspense fallback={<NoteLoadingSkeleton />}>
            {selectedTopic ? (
              <div className="space-y-6">
                <TopicHeader
                  topic={selectedTopic}
                  generatedNote={generatedNote}
                  cacheSource={cacheSource}
                  loading={loading}
                  onGenerate={() => handleGenerate(false, false)}
                />

                {loading && !isRefining && <NoteLoadingSkeleton />}

                {generatedNote && !(loading && !isRefining) && (
                  <>
                    <ExportActions
                      generatedNote={generatedNote}
                      selectedTopic={selectedTopic}
                      currentTerm={currentTerm}
                      isPremium={isPremium}
                      onRegenerate={() => handlePremiumAction(() => handleGenerate(false, true), "regenerate")}
                      onDownload={() => handlePremiumAction(handleExportPDF, "download")}
                    />

                    {editLimitReached && (
                      <EditLimitBanner onReset={handleResetToOriginal} isResetting={isResetting} />
                    )}

                    {isRefining && (
                      <p className="text-sm text-muted-foreground pl-3 border-l-2 border-border">
                        Applying changes
                        {instruction ? `: "${instruction.slice(0, 60)}${instruction.length > 60 ? "…" : ""}"` : "…"}
                      </p>
                    )}

                    <div
                      ref={printRef}
                      className={[
                        "overflow-hidden bg-card",
                        "-mx-4 sm:mx-0",
                        "border-y sm:border sm:rounded-xl border-border",
                        "print:border-0 print:rounded-none print:mx-0",
                        "transition-opacity duration-200",
                        isRefining || isResetting ? "opacity-50 pointer-events-none" : "opacity-100",
                      ].join(" ")}
                    >
                      <LessonNoteViewer
                        content={generatedNote.content}
                        title={generatedNote.title}
                      />
                    </div>

                    {!editLimitReached && (
                      <RefinementPanel
                        generatedNote={generatedNote}
                        instruction={instruction}
                        setInstruction={setInstruction}
                        loading={loading || isRefining}
                        isPremium={isPremium}
                        onRefine={() => handleGenerate(true, false)}
                      />
                    )}
                  </>
                )}
              </div>
            ) : (
              <EmptyState />
            )}
          </Suspense>
        </div>
      </main>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={lockedFeature}
      />
    </div>
  );
}