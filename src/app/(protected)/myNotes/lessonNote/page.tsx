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

// Plain grey bars — no spinners, no pulse
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

// Shown when the user hits the edit limit — friendly, not a dead end
function EditLimitBanner({
  onReset,
  isResetting,
}: {
  onReset: () => void;
  isResetting: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="text-sm text-muted-foreground leading-snug">
        You&rsquo;ve reached the refinement limit for this note. Try generating
        a new sub-topic, or reset to the original version — it&rsquo;s already
        looking great.
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
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

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
          const premiumRes = await fetch("/api/user/premium-status");
          if (premiumRes.ok) {
            const premiumData = await premiumRes.json();

            setUserEmail(premiumData.userEmail || "");
            setUserId(premiumData.userId || "");

            isPremiumStatus =
              premiumData.isPremium ||
              ["premium", "school"].includes(
                premiumData.subscriptionTier || ""
              ) ||
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

        const res = await fetch(
          `/api/generate-lesson-note/${selectedTopic.id}`,
          { credentials: "include" }
        );

        if (res.status === 404) {
          setGeneratedNote(null);
          setCacheSource(null);
          return;
        }

        if (!res.ok) throw new Error("Fetch failed");

        const data = await res.json();

        if (data.note) {
          setGeneratedNote(data.note);
          setCacheSource("cache");
        } else {
          setGeneratedNote(null);
          setCacheSource(null);
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        toast.error("Could not load note. Try selecting the topic again.");
      } finally {
        setLoading(false);
      }
    };

    fetchExistingNote();
  }, [selectedTopic?.id]);

  // ─── Reset edit limit when topic changes ─────────────────────────────────
  useEffect(() => {
    setEditLimitReached(false);
  }, [selectedTopic?.id]);

  // ─── Premium gate ─────────────────────────────────────────────────────────
  const handlePremiumAction = (action: () => void, feature: string) => {
    if (!isPremium) {
      setLockedFeature(feature);
      setShowUpgradeModal(true);
      return;
    }
    action();
  };

  // ─── Reset to original — no tokens consumed ───────────────────────────────
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
      const res = await fetch(
        `/api/lesson-note/${generatedNote.id}/reset`,
        { method: "POST", credentials: "include" }
      );

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
  const handleGenerate = async (
    isRefinement = false,
    forceRegenerate = false
  ) => {
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
            toast.error("You've reached your note limit", {
              id: toastId,
              description: result.error,
              duration: 5000,
            });
            setLockedFeature("generation");
            setShowUpgradeModal(true);
            break;

          case "PREMIUM_REQUIRED":
            toast.error("Upgrade to rewrite notes", {
              id: toastId,
              description: "Regeneration is available on Premium plans.",
              duration: 4000,
            });
            setLockedFeature("regenerate");
            setShowUpgradeModal(true);
            break;

          case "REGENERATE_LIMIT":
            toast.error("Already rewritten once", {
              id: toastId,
              description:
                "Use the refinement box below to keep improving this note.",
              duration: 4000,
            });
            break;

          case "EDIT_LIMIT":
            toast.dismiss(toastId);
            setEditLimitReached(true);
            if (!isPremium) {
              setLockedFeature("refinement");
              setShowUpgradeModal(true);
            }
            break;

          case "COOLDOWN":
            toast.error("Please wait a moment", {
              id: toastId,
              description: result.error,
              duration: 4000,
            });
            break;

          default:
            toast.error(
              result.error || "Something went wrong. Please try again.",
              { id: toastId, duration: 4000 }
            );
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
          toast.info("Free trial used", {
            description: "Upgrade for unlimited notes and edits.",
            duration: 5000,
          });
        }
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      if (isRefinement && previousNote) setGeneratedNote(previousNote);
      setIsRefining(false);
      setPreviousNote(null);
      toast.error("Connection error", {
        id: toastId,
        description: "Check your internet and try again.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ─── PDF export ───────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!printRef.current) return;

    toast.loading("Preparing PDF…", { id: "pdf-export" });

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const clonedElement = printRef.current.cloneNode(true) as HTMLElement;

      clonedElement.querySelectorAll("*").forEach((el) => {
        const htmlEl = el as HTMLElement;
        const cs = window.getComputedStyle(el);
        if (cs.backgroundColor?.includes("lab"))
          htmlEl.style.backgroundColor = "#ffffff";
        if (cs.color?.includes("lab")) htmlEl.style.color = "#000000";
        if (cs.borderColor?.includes("lab"))
          htmlEl.style.borderColor = "#e5e7eb";
      });

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10] as [number, number, number, number],
          filename: `${selectedTopic?.topicTitle || "Lesson Note"} - ${currentTerm}.pdf`,
          image: { type: "jpeg" as const, quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            backgroundColor: "#ffffff",
            removeContainer: true,
          },
          jsPDF: {
            unit: "mm" as const,
            format: "a4" as const,
            orientation: "portrait" as const,
          },
        })
        .from(clonedElement)
        .save();

      toast.success("PDF saved", { id: "pdf-export", duration: 2500 });
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF failed. Please try again.", {
        id: "pdf-export",
        duration: 4000,
      });
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
        {/* ↓ px-4 on mobile (was px-6), lg stays px-10 */}
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-10">
          <Suspense fallback={<NoteLoadingSkeleton />}>
            {selectedTopic ? (
              <div className="space-y-6">
                {/* Topic heading + generate button */}
                <TopicHeader
                  topic={selectedTopic}
                  generatedNote={generatedNote}
                  cacheSource={cacheSource}
                  loading={loading}
                  onGenerate={() => handleGenerate(false, false)}
                />

                {/* Cold-load skeleton */}
                {loading && !isRefining && <NoteLoadingSkeleton />}

                {/* Note area */}
                {generatedNote && !(loading && !isRefining) && (
                  <>
                    {/* Regenerate / print / download */}
                    <ExportActions
                      generatedNote={generatedNote}
                      selectedTopic={selectedTopic}
                      currentTerm={currentTerm}
                      isPremium={isPremium}
                      printRef={printRef}
                      onRegenerate={() =>
                        handlePremiumAction(
                          () => handleGenerate(false, true),
                          "regenerate"
                        )
                      }
                      onPrint={() => handlePremiumAction(handlePrint, "print")}
                      onDownload={() =>
                        handlePremiumAction(handleExportPDF, "download")
                      }
                    />

                    {/* Edit-limit friendly banner with reset button */}
                    {editLimitReached && (
                      <EditLimitBanner
                        onReset={handleResetToOriginal}
                        isResetting={isResetting}
                      />
                    )}

                    {/* Refinement status — one quiet line */}
                    {isRefining && (
                      <p className="text-sm text-muted-foreground pl-3 border-l-2 border-border">
                        Applying changes
                        {instruction
                          ? `: "${instruction.slice(0, 60)}${
                              instruction.length > 60 ? "…" : ""
                            }"`
                          : "…"}
                      </p>
                    )}

                    {/* Note viewer — edge-to-edge on mobile, card on desktop */}
                    <div
                      ref={printRef}
                      className={[
                        "overflow-hidden bg-card",
                        // Mobile: flush to screen edges, no radius
                        // Desktop: contained card with border and radius
                        "-mx-4 sm:mx-0",
                        "border-y sm:border sm:rounded-xl border-border",
                        "print:border-0 print:rounded-none print:mx-0",
                        "transition-opacity duration-200",
                        isRefining || isResetting
                          ? "opacity-50 pointer-events-none"
                          : "opacity-100",
                      ].join(" ")}
                    >
                      <LessonNoteViewer
                        content={generatedNote.content}
                        title={generatedNote.title}
                      />
                    </div>

                    {/* Refinement input — hidden once limit is reached */}
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