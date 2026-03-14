"use client";

// app/(dashboard)/assessments/page.tsx

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  FileText, BookOpen, ClipboardList,
  Loader2, Printer, Download, RotateCcw,
  AlertCircle, Check, ChevronUp, ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { LessonNoteViewer } from "@/components/lessonNoteViewer/lessonNoteViewer";

type AssessmentType   = "Exam" | "Test" | "Assignment";
type AssessmentFormat = "Objectives" | "Theory" | "Mixed";
type PageState        = "configure" | "loading" | "result";

interface LessonNoteCard {
  id:         string;
  subject:    string;
  topic:      string;
  gradeLevel: string;
  createdAt:  string;
}

interface Config {
  type:        AssessmentType;
  format:      AssessmentFormat;
  objCount:    number;
  theoryCount: number;
  term:        string;
  duration:    string;
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ value, min, max, onChange }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="px-3 py-2 bg-muted hover:bg-muted/70 text-muted-foreground transition-colors disabled:opacity-40"
      >
        <ChevronDown size={14} />
      </button>
      <span className="px-4 py-2 text-sm font-semibold text-foreground bg-background min-w-[3rem] text-center tabular-nums">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="px-3 py-2 bg-muted hover:bg-muted/70 text-muted-foreground transition-colors disabled:opacity-40"
      >
        <ChevronUp size={14} />
      </button>
    </div>
  );
}

// ── Pill toggle ───────────────────────────────────────────────────────────────
function PillGroup<T extends string>({ options, value, onChange, icons }: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Partial<Record<string, React.ReactNode>>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
            ${value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
            }`}
        >
          {icons?.[opt]}
          {opt}
        </button>
      ))}
    </div>
  );
}

// ── Note card ─────────────────────────────────────────────────────────────────
function NoteCard({ note, selected, onToggle, disabled }: {
  note: LessonNoteCard;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  const date = new Date(note.createdAt).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
  return (
    <button
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-150
        ${selected
          ? "border-primary bg-primary/5"
          : disabled
            ? "border-border bg-muted/20 opacity-50 cursor-not-allowed"
            : "border-border bg-background hover:border-primary/40"
        }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors
          ${selected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
          {selected && <Check size={9} className="text-primary-foreground" strokeWidth={3} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{note.topic}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {note.subject} · {note.gradeLevel} · {date}
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Loading screen ────────────────────────────────────────────────────────────
function LoadingView({ format }: { format: AssessmentFormat }) {
  const [sectionADone, setSectionADone] = useState(false);
  useEffect(() => {
    if (format !== "Mixed") return;
    const t = setTimeout(() => setSectionADone(true), 9000);
    return () => clearTimeout(t);
  }, [format]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] gap-6 px-4">
      <div className="w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center">
        <Loader2 size={28} className="text-primary animate-spin" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Setting questions from your notes…</h2>
        <p className="text-sm text-muted-foreground mt-1">This takes about 15–30 seconds</p>
      </div>
      {format === "Mixed" && (
        <div className="w-full max-w-xs space-y-2">
          {[
            { label: "Section A — Objectives", done: sectionADone },
            { label: "Section B — Theory & Marking Scheme", done: false },
          ].map((s, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-lg border
              ${s.done ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
              {s.done
                ? <CheckCircle2 size={16} className="text-primary flex-shrink-0" />
                : <Loader2 size={16} className="text-muted-foreground animate-spin flex-shrink-0" />
              }
              <span className={`text-sm ${s.done ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const [pageState,    setPageState]    = useState<PageState>("configure");
  const [notes,        setNotes]        = useState<LessonNoteCard[]>([]);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [result,       setResult]       = useState<{ id: string; content: string } | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [notesLoading, setNotesLoading] = useState(true);
  const paperRef = useRef<HTMLDivElement | null>(null);

  // Quota — fetched on load, updated after each generation
  const [quota, setQuota] = useState<{
    Exam: { used: number; limit: number };
    Test: { used: number; limit: number };
    Assignment: { used: number; limit: number };
    tier: "free" | "premium";
  } | null>(null);

  const [config, setConfig] = useState<Config>({
    type: "Test", format: "Mixed",
    objCount: 15, theoryCount: 5,
    term: "First Term", duration: "45 minutes",
  });

  // Auto-fill duration when type changes
  useEffect(() => {
    setConfig(c => ({
      ...c,
      duration: c.type === "Exam" ? "1 hour 30 minutes" : "45 minutes",
    }));
  }, [config.type]);

  // Fetch teacher's notes from dedicated endpoint
  useEffect(() => {
    fetch("/api/assessments_note")
      .then(r => r.json())
      .then(d => setNotes(d.lessonNotes ?? []))
      .catch(() => setError("Could not load your lesson notes. Please refresh."))
      .finally(() => setNotesLoading(false));

    fetch("/api/assessments/quota")
      .then(r => r.json())
      .then(d => { if (!d.error) setQuota(d); })
      .catch(() => {}); // non-critical
  }, []);

  // ── CHANGE 1: maxNotes is dynamic based on assessment type ────────────────
  // Exam covers more topics so teachers need more source notes.
  // Test and Assignment are narrower in scope so 3 notes is enough.
  const maxNotes = config.type === "Exam" ? 10 : 3;

  // ── CHANGE 2: toggleNote respects dynamic maxNotes ────────────────────────
  const toggleNote = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxNotes) next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    setError(null);
    setPageState("loading");
    const firstNote = notes.find(n => selectedIds.has(n.id));
    try {
      const res = await fetch("/api/assessments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedNoteIds: Array.from(selectedIds),
          config: {
            ...config,
            subject:    firstNote?.subject    ?? "",
            classLevel: firstNote?.gradeLevel ?? "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed.");
      setResult({ id: data.id, content: data.content });
      // Update quota count locally — avoids a refetch
      if (data.quota) {
        setQuota(prev => prev ? {
          ...prev,
          [data.quota.type]: { used: data.quota.used, limit: data.quota.limit },
        } : prev);
      }
      setPageState("result");
    } catch (err: any) {
      setError(err.message);
      setPageState("configure");
    }
  };

  // ─── PDF export ───────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!paperRef.current) return;
    const toastId = "pdf-export";
    toast.loading("Preparing PDF...", { id: toastId });

    try {
      const katexHref =
        Array.from(document.styleSheets)
          .map(s => { try { return s.href ?? ""; } catch { return ""; } })
          .find(h => h.includes("katex")) ?? "";

      const paperHTML = paperRef.current.innerHTML;
      const firstNote = notes.find((n: LessonNoteCard) => selectedIds.has(n.id));
      const title     = (firstNote?.subject ?? "Assessment") + " — " + config.type;

      const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isMobile  = isIOS || isAndroid;

      // Opera Mini in Extreme mode proxies all requests through its servers
      // and blocks script-generated Blob URLs — PDF will silently fail.
      // Warn the teacher early so they know to switch browsers.
      const isOperaMini = /Opera Mini/i.test(navigator.userAgent);
      if (isOperaMini) {
        toast.error(
          "Opera Mini does not support PDF export. Please open this page in Chrome or Safari to download your PDF.",
          { id: toastId, duration: 10000 }
        );
        return;
      }

      // Build platform instruction text using plain string concat — avoids
      // nested template literal errors that TypeScript cannot type-check.
      const stepText = isIOS
        ? "On iPhone/iPad: tap the <strong>Share icon</strong> (box with arrow) at the bottom &rarr; <strong>Print</strong> &rarr; pinch outward on the preview to save as PDF"
        : "On Android: tap the <strong>&#8942; three-dot menu</strong> &rarr; <strong>Share</strong> &rarr; <strong>Print</strong> &rarr; tap the PDF icon to save";

      const mobileBanner = isMobile
        ? '<div class="mobile-banner">'
          + '<div class="banner-title">&#128196; Your document is ready</div>'
          + '<div class="banner-steps"><span>' + stepText + "</span></div>"
          + '<button id="print-btn" class="banner-btn" onclick="window.print()">Open Print / Save as PDF</button>'
          + "</div>"
        : "";

      const katexScript = (isMobile && katexHref)
        ? '<script>(function(){'
          + 'var btn=document.getElementById("print-btn");if(!btn)return;'
          + 'btn.disabled=true;btn.style.opacity="0.5";btn.textContent="\u23f3 Loading equations...";'
          + 'var lnk=document.querySelector("link[href*=\'katex\']");'
          + 'function en(){btn.disabled=false;btn.style.opacity="1";btn.textContent="Open Print / Save as PDF";}'
          + 'if(!lnk||lnk.sheet){en();return;}'
          + 'lnk.addEventListener("load",en);setTimeout(en,2000);'
          + '})();<\/script>'
        : "";

      const desktopScript = !isMobile
        ? '<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},500);};<\/script>'
        : "";

      const katexLink = katexHref ? '<link rel="stylesheet" href="' + katexHref + '"/>' : "";

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  ${katexLink}
  <style>
    @page{size:A4;margin:0mm;}
    @media screen{body{max-width:780px;margin:0 auto;padding:16px;}}
    @media print{
      .mobile-banner{display:none!important;}
      h1,h2,h3{page-break-after:avoid;}
      p,li{orphans:3;widows:3;}
      section,.section{page-break-inside:avoid;}
      table{page-break-inside:avoid;}
    }
    *,*::before,*::after{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#1a1a1a;background:#fff;padding:18mm 16mm;margin:0;}
    h1{font-size:18px;font-weight:700;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:6px;}
    h2{font-size:15px;font-weight:700;margin:18px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;}
    h3{font-size:13px;font-weight:700;margin:12px 0 4px;}
    p{margin:5px 0;}ul,ol{margin:5px 0 5px 20px;}li{margin:3px 0;}
    strong{font-weight:700;}em{font-style:italic;}
    table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;}
    th,td{border:1px solid #e5e7eb;padding:5px 10px;text-align:left;}
    th{background:#f9fafb;font-weight:600;}
    hr{border:none;border-top:1px solid #e5e7eb;margin:12px 0;}
    blockquote{border-left:3px solid #ccc;margin:6px 0;padding:4px 12px;color:#555;}
    code{font-family:"Courier New",monospace;font-size:11px;background:#f3f4f6;padding:1px 4px;border-radius:3px;}
    pre{background:#f3f4f6;padding:10px;border-radius:4px;margin:8px 0;}
    .katex-display{margin:10px 0;padding:6px 12px;background:#f8fafc;border-radius:4px;}
    .no-print{display:none!important;}
    .mobile-banner{position:sticky;top:0;z-index:999;background:#1d4ed8;color:#fff;padding:14px 16px;margin:-18mm -16mm 24px -16mm;font-family:-apple-system,sans-serif;}
    .banner-title{font-weight:700;font-size:15px;margin-bottom:6px;}
    .banner-steps{font-size:13px;opacity:.92;margin-bottom:12px;line-height:1.5;}
    .banner-btn{background:#fff;color:#1d4ed8;border:none;border-radius:8px;padding:10px 20px;font-weight:700;font-size:14px;cursor:pointer;}
  </style>
</head>
<body>
  ${mobileBanner}
  ${paperHTML}
  ${katexScript}
  ${desktopScript}
</body>
</html>`;

      // Blob URL — no document.write, no about:blank, no deprecation warnings
      const blob    = new Blob([html], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);

      const printWindow = window.open(blobUrl, "PRINT_WINDOW", "width=900,height=650");
      if (!printWindow) {
        URL.revokeObjectURL(blobUrl);
        toast.error(
          "Pop-up blocked. Tap the browser menu → Settings → Pop-ups → Allow for this site.",
          { id: toastId, duration: 8000 }
        );
        return;
      }

      // Free the blob memory after the browser has loaded it
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      toast.success(
        isMobile
          ? "Document ready — follow the blue bar instructions to save as PDF"
          : "Opening print dialog...",
        { id: toastId, duration: isMobile ? 6000 : 3000 }
      );

    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF failed. Please try again.", { id: toastId });
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedIds(new Set());
    setError(null);
    setPageState("configure");
  };

  const showObj     = config.format !== "Theory";
  const showTheory  = config.format !== "Objectives";
  const mixedTotal  = config.objCount + config.theoryCount;
  const overLimit   = config.format === "Mixed" && mixedTotal > 30;
  const canGenerate = selectedIds.size > 0 && !overLimit;
  const firstNote   = notes.find(n => selectedIds.has(n.id));

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <LoadingView format={config.format} />
      </div>
    );
  }

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (pageState === "result" && result) {
    const title = `${firstNote?.subject ?? "Assessment"} ${firstNote?.gradeLevel ?? ""} — ${config.type}`;
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Generated from your lesson notes</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              <RotateCcw size={13} /> New
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors print:hidden">
              <Printer size={13} /> Print
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity print:hidden">
              <Download size={13} /> PDF
            </button>
          </div>
        </div>
        <div ref={paperRef} className="rounded-xl border border-border bg-card p-5 sm:p-10 print:border-0 print:p-0">
          <LessonNoteViewer
            content={result.content}
            title={`${firstNote?.subject ?? ""} ${firstNote?.gradeLevel ?? ""} — ${config.type}`}
          />
        </div>
      </div>
    );
  }

  // ── CONFIGURE ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">

      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Assessment Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Questions are set only from your selected lesson notes.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-4">

        {/* Settings */}
        <div className="space-y-4">

          {/* Type */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Type</p>
            <PillGroup<AssessmentType>
              options={["Test", "Exam", "Assignment"]}
              value={config.type}
              onChange={type => setConfig(c => ({ ...c, type }))}
              icons={{
                Test: <ClipboardList size={13} />,
                Exam: <FileText size={13} />,
                Assignment: <BookOpen size={13} />,
              }}
            />
          </div>

          {/* Format + counts */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Format</p>
            <PillGroup<AssessmentFormat>
              options={["Mixed", "Objectives", "Theory"]}
              value={config.format}
              onChange={format => setConfig(c => ({ ...c, format }))}
            />
            {(showObj || showTheory) && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {showObj && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Objectives</p>
                      <p className="text-xs text-muted-foreground">Max 20 · 1 mark each</p>
                    </div>
                    <Stepper value={config.objCount} min={1} max={20}
                      onChange={v => setConfig(c => ({ ...c, objCount: v }))} />
                  </div>
                )}
                {showTheory && (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Theory</p>
                      <p className="text-xs text-muted-foreground">Max 10 · 10 marks each</p>
                    </div>
                    <Stepper value={config.theoryCount} min={1} max={10}
                      onChange={v => setConfig(c => ({ ...c, theoryCount: v }))} />
                  </div>
                )}
                {config.format === "Mixed" && (
                  <p className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg
                    ${overLimit ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <AlertCircle size={12} />
                    {overLimit ? `Total ${mixedTotal} — reduce to 30 or fewer` : `Total: ${mixedTotal} questions`}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Term & Duration */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Paper Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Term</label>
                <select
                  value={config.term}
                  onChange={e => setConfig(c => ({ ...c, term: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option>First Term</option>
                  <option>Second Term</option>
                  <option>Third Term</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duration</label>
                <input
                  type="text"
                  value={config.duration}
                  onChange={e => setConfig(c => ({ ...c, duration: e.target.value }))}
                  placeholder="e.g. 45 minutes"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Note selector */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Your Notes
              </p>
              {/* CHANGE 3: badge shows dynamic maxNotes */}
              {selectedIds.size > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {selectedIds.size} / {maxNotes}
                </span>
              )}
            </div>

            <div className="overflow-y-auto p-3 space-y-2"
              style={{ maxHeight: "min(420px, 55vh)" }}>
              {notesLoading ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen size={28} className="text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No lesson notes yet.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Generate notes first, then come back here.
                  </p>
                </div>
              ) : (
                notes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    selected={selectedIds.has(note.id)}
                    onToggle={() => toggleNote(note.id)}
                    // CHANGE 4: disabled threshold uses dynamic maxNotes
                    disabled={selectedIds.size >= maxNotes}
                  />
                ))
              )}
            </div>

            {/* CHANGE 5: footer hint shows dynamic maxNotes and explains why */}
            <div className="px-4 py-2.5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {config.type === "Exam"
                  ? "Up to 10 notes for Exam · Questions come only from selected topics"
                  : "Up to 3 notes for Test / Assignment · Questions come only from selected topics"
                }
              </p>
            </div>
          </div>

          {/* Quota bar */}
          {quota && (() => {
            const q = quota[config.type];
            const remaining = q.limit - q.used;
            const exhausted = remaining <= 0;
            const nearLimit = remaining === 1;
            if (q.limit === 0) return (
              <div className="px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/10 text-xs text-destructive font-medium flex items-center gap-2">
                <AlertCircle size={13} />
                Exam generation requires a Premium account.
              </div>
            );
            return (
              <div className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center justify-between
                ${exhausted ? "border-destructive/20 bg-destructive/10 text-destructive"
                  : nearLimit ? "border-amber-500/20 bg-amber-500/10 text-amber-700"
                  : "border-border bg-muted text-muted-foreground"}`}>
                <span>
                  {config.type}: {q.used} / {q.limit} used
                  {quota.tier === "free" ? " (free plan)" : " this cycle"}
                </span>
                {exhausted && <span className="font-bold">Upgrade to generate more</span>}
                {nearLimit && !exhausted && <span className="font-semibold">1 left</span>}
              </div>
            );
          })()}

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || (quota ? quota[config.type].used >= quota[config.type].limit : false)}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150
              ${canGenerate
                ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            {canGenerate
              ? `Generate ${config.type} · ${selectedIds.size} note${selectedIds.size > 1 ? "s" : ""}`
              : quota && quota[config.type].limit > 0 && quota[config.type].used >= quota[config.type].limit
              ? `${config.type} limit reached — upgrade to continue`
              : "Select at least one note"
            }
          </button>
        </div>
      </div>
    </div>
  );
}