"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Search, FileText, Zap, Crown, BookOpen,
  AlertCircle, Eye, ClipboardList, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { UpgradeModal } from "@/app/(protected)/myNotes/lessonNote/components/upgradeModal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AssessmentCard {
  id:          string;
  type:        "Exam" | "Test" | "Assignment";
  format:      "Objectives" | "Theory" | "Mixed";
  subject:     string;
  classLevel:  string;
  term:        string | null;
  objCount:    number;
  theoryCount: number;
  createdAt:   string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function assessmentTypeColor(type: AssessmentCard["type"]) {
  if (type === "Exam")       return "bg-blue-500/10 text-blue-600";
  if (type === "Test")       return "bg-violet-500/10 text-violet-600";
  return                            "bg-emerald-500/10 text-emerald-600";
}

function questionSummary(a: AssessmentCard) {
  if (a.format === "Objectives") return `${a.objCount} objectives`;
  if (a.format === "Theory")     return `${a.theoryCount} theory`;
  return `${a.objCount} obj · ${a.theoryCount} theory`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-card border p-4 rounded-lg">
      <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data,        setData]        = useState<any>(null);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [loading,     setLoading]     = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard?t=" + Date.now())
      .then(res => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(data => { setData(data); setLoading(false); })
      .catch(err => {
        console.error("Dashboard error:", err);
        toast.error("Failed to load dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto text-destructive mb-4" size={48} />
          <p className="font-bold mb-2">Failed to load dashboard</p>
          <button onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  const filteredNotes = data.notes.filter((n: any) =>
    n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const percentageUsed = (data.stats.used / data.stats.limit) * 100;
  const isNearLimit    = data.stats.remaining <= 2;
  const recentAssessments: AssessmentCard[] = data.recentAssessments ?? [];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {data.profile.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {data.profile.schoolName} • {data.profile.subjectTaught}
            </p>
            {data.stats.isPremium && (
              <div className="flex items-center gap-2 mt-2">
                <Crown size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-600">Premium Member</span>
              </div>
            )}
          </div>

          {/* Usage Quota */}
          <div className="bg-card p-4 rounded-lg border w-full sm:w-80">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span>NOTE QUOTA</span>
              <span className={isNearLimit ? "text-destructive" : "text-primary"}>
                {data.stats.used} / {data.stats.limit}
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isNearLimit ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{data.stats.remaining} notes remaining</p>
            {isNearLimit && !data.stats.isPremium && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="mt-3 w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>

        {/* Stats — now 5 cards including Assessments */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Notes"   value={data.stats.totalGenerated} />
          <StatCard label="Time Saved"    value={`${data.stats.timeSavedHours}h`} />
          <StatCard label="Refinements"   value={data.stats.totalEdits} />
          <StatCard label="Exports"       value={data.stats.totalExports} />
          <StatCard label="Assessments"   value={data.stats.totalAssessments ?? 0} />
        </div>

        {/* Quick Actions — Assessment Generator added */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Link
            href="/myNotes/lessonNote"
            className="bg-card border p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <Zap className="text-primary mb-2" size={24} />
            <p className="font-bold">Generate Note</p>
            <p className="text-xs text-muted-foreground">Create new lesson</p>
          </Link>

          <Link
            href="/community/schemeOfWork/viewSow"
            className="bg-card border p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <BookOpen className="text-emerald-500 mb-2" size={24} />
            <p className="font-bold">My Scheme</p>
            <p className="text-xs text-muted-foreground">View curriculum</p>
          </Link>

          {/* Assessment Generator quick action */}
          <Link
            href="/community/dashboard/assessments"
            className="bg-card border p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <ClipboardList className="text-violet-500 mb-2" size={24} />
            <p className="font-bold">Assessments</p>
            <p className="text-xs text-muted-foreground">Generate exam or test</p>
          </Link>

          <button
            onClick={() => setShowUpgrade(true)}
            className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-lg text-white text-left hover:from-amber-600 hover:to-orange-600 transition-all active:scale-95"
          >
            <Crown className="mb-2" size={24} />
            <p className="font-bold">Upgrade</p>
            <p className="text-xs opacity-90">Unlock premium</p>
          </button>
        </div>

        {/* Recent Assessments */}
        <div className="bg-card border rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Recent Assessments</h2>
              <p className="text-sm text-muted-foreground">
                {data.stats.totalAssessments ?? 0} total generated
              </p>
            </div>
            <Link
              href="/community/dashboard/assessments"
              className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              New <ChevronRight size={14} />
            </Link>
          </div>

          {recentAssessments.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAssessments.map((a) => (
                <Link
                  key={a.id}
                  href={`/community/dashboard/assessments/${a.id}`}
                  className="border rounded-lg p-4 hover:bg-accent transition-colors group"
                >
                  {/* Type + format badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${assessmentTypeColor(a.type)}`}>
                      {a.type}
                    </span>
                    <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-medium rounded">
                      {a.format}
                    </span>
                  </div>

                  {/* Subject + class */}
                  <p className="font-bold text-sm line-clamp-1">{a.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.classLevel} · {a.term ?? ""}
                  </p>

                  {/* Questions summary + date */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{questionSummary(a)}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </div>

                  {/* View hint on hover */}
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={11} /> View assessment
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto text-muted-foreground/30 mb-3" size={40} />
              <p className="text-sm text-muted-foreground mb-3">No assessments generated yet</p>
              <Link
                href="/community/dashboard/assessments"
                className="text-sm font-bold text-primary hover:underline"
              >
                Generate your first assessment
              </Link>
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="bg-card border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold">Your Notes</h2>
              <p className="text-sm text-muted-foreground">{data.notes.length} total</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note: any) => (
                <div key={note.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                    {note.gradeLevel}
                  </span>
                  <h3 className="font-bold mt-3 mb-1 line-clamp-2">{note.title}</h3>
                  <p className="text-sm text-primary mb-3">{note.subject}</p>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-muted-foreground">{note.wordCount || 0} words</span>
                    {note.schemeSubTopicId ? (
                  <Link
                    href={`/myNotes/lessonNote?topic=${note.schemeSubTopicId}`}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1"
                  >
                    <Eye size={12} /> View
                  </Link>
                ) : (
                  <Link
                    href="/myNotes/lessonNote"
                    className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-lg flex items-center gap-1"
                  >
                    <Eye size={12} /> Open
                  </Link>
                )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileText className="mx-auto text-muted-foreground/30 mb-3" size={48} />
              <p className="text-muted-foreground mb-2">
                {searchTerm ? "No notes found" : "No notes yet"}
              </p>
              {!searchTerm && (
                <Link href="/myNotes/lessonNote" className="text-primary text-sm font-bold hover:underline">
                  Generate your first note
                </Link>
              )}
            </div>
          )}
        </div>

      </div>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={null}
      />
    </div>
  );
}