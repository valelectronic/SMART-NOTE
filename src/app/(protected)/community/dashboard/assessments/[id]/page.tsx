"use client";

// app/(dashboard)/assessments/[id]/page.tsx

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Printer, Download, ArrowLeft,
  Trash2, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { LessonNoteViewer } from "@/components/lessonNoteViewer/lessonNoteViewer";

interface Assessment {
  id:          string;
  type:        "Exam" | "Test" | "Assignment";
  format:      "Objectives" | "Theory" | "Mixed";
  subject:     string;
  classLevel:  string;
  term:        string | null;
  duration:    string | null;
  objCount:    number;
  theoryCount: number;
  content:     string;
  createdAt:   string;
}

export default function AssessmentViewPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const paperRef = useRef<HTMLDivElement | null>(null);

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // ── Fetch assessment ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/assessments/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setAssessment(d.assessment);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExportPDF = async () => {
    if (!paperRef.current || !assessment) return;
    const toastId = "pdf-export";
    toast.loading("Preparing PDF...", { id: toastId });

    try {
      const katexHref =
        Array.from(document.styleSheets)
          .map(s => { try { return s.href ?? ""; } catch { return ""; } })
          .find(h => h.includes("katex")) ?? "";

      const paperHTML = paperRef.current.innerHTML;
      const title = `${assessment.subject} ${assessment.classLevel} — ${assessment.type}`;

      // window.open fixes blank pages on mobile — popup windows are fully
      // rendered by the browser before printing, unlike iframes.
      const printWindow = window.open("", "_blank", "width=900,height=650");
      if (!printWindow) {
        toast.error(
          "Pop-up blocked. To save as PDF: tap the menu in your browser → Settings → Pop-ups → Allow for this site.",
          { id: toastId, duration: 8000 }
        );
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  ${katexHref ? `<link rel="stylesheet" href="${katexHref}"/>` : ""}
  <style>
    @page { size: A4; margin: 0mm; }
    *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: -apple-system, "Inter", sans-serif; font-size: 13px; line-height: 1.7; color: #1a1a1a; background: #ffffff; padding: 18mm 16mm; margin: 0; }
    h1 { font-size: 18px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 6px; }
    h2 { font-size: 15px; font-weight: 700; margin: 18px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
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
    code { font-family: monospace; font-size: 11px; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
    pre { background: #f3f4f6; padding: 10px; border-radius: 4px; margin: 8px 0; }
    .katex-display { margin: 10px 0; padding: 6px 12px; background: #f8fafc; border-radius: 4px; }
    .no-print { display: none !important; }

    /* ── Mobile page-break rules ── */
    @media print {
      h1, h2, h3 { page-break-after: avoid; }
      p, li { orphans: 3; widows: 3; }
      section, .section { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>${paperHTML}</body>
</html>`);
      printWindow.document.close();

      printWindow.onload = () => {
        // 500ms delay lets KaTeX, Mermaid diagrams and fonts fully paint
        // before the print dialog opens — prevents cut-off content on mobile.
        setTimeout(() => {
          try {
            printWindow.focus();
            printWindow.print();
            toast.success("Print dialog opened — select 'Save as PDF'", { id: toastId, duration: 4000 });
          } catch (e) {
            console.error(e);
            toast.error("Print failed", { id: toastId });
          } finally {
            setTimeout(() => printWindow.close(), 2000);
          }
        }, 500);
      };

    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("PDF failed. Please try again.", { id: toastId });
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Assessment deleted");
      router.push("/assessments");
    } catch {
      toast.error("Could not delete assessment. Try again.");
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={28} className="text-primary animate-spin" />
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={40} className="text-destructive mx-auto mb-4" />
        <p className="font-semibold text-foreground mb-1">Assessment not found</p>
        <p className="text-sm text-muted-foreground mb-6">{error ?? "This assessment does not exist or you don't have access."}</p>
        <Link href="/assessments" className="text-sm font-bold text-primary hover:underline">
          ← Back to Assessments
        </Link>
      </div>
    );
  }

  const title = `${assessment.subject} ${assessment.classLevel} — ${assessment.type}`;
  const date  = new Date(assessment.createdAt).toLocaleDateString("en-NG", {
    day: "numeric", month: "long", year: "numeric",
  });

  // ── Result ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/assessments"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {assessment.term ?? ""} · {date}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Delete with confirm-on-first-click */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors
              ${confirmDel
                ? "border-destructive bg-destructive text-destructive-foreground hover:opacity-90"
                : "border-border text-muted-foreground hover:bg-muted"
              }`}
          >
            {deleting
              ? <Loader2 size={13} className="animate-spin" />
              : <Trash2 size={13} />
            }
            {deleting ? "Deleting…" : confirmDel ? "Confirm delete" : "Delete"}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors print:hidden"
          >
            <Printer size={13} /> Print
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity print:hidden"
          >
            <Download size={13} /> PDF
          </button>
        </div>
      </div>

      {/* Cancel confirm on click away */}
      {confirmDel && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle size={15} className="flex-shrink-0" />
          Click "Confirm delete" again to permanently remove this assessment.
          <button onClick={() => setConfirmDel(false)} className="ml-auto underline text-xs">
            Cancel
          </button>
        </div>
      )}

      {/* Paper */}
      <div ref={paperRef} className="rounded-xl border border-border bg-card p-5 sm:p-10 print:border-0 print:p-0">
        <LessonNoteViewer
          content={assessment.content}
          title={title}
        />
      </div>

    </div>
  );
}