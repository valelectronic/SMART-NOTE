"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { 
  Search, FileText, Zap, Crown, Download, BookOpen, 
  AlertCircle, Eye, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/dashboard")
      .then(res => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
        toast.error("Failed to load dashboard");
        setLoading(false);
      });
  }, []);

  // ✅ Simple loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Simple error state
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto text-destructive mb-4" size={48} />
          <p className="font-bold mb-2">Failed to load dashboard</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-sm text-primary hover:underline"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  const filteredNotes = data.notes.filter((n: any) => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const percentageUsed = (data.stats.used / data.stats.limit) * 100;
  const isNearLimit = data.stats.remaining <= 2;

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
                className={`h-full ${isNearLimit ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.stats.remaining} notes remaining
            </p>
            {isNearLimit && !data.stats.isPremium && (
              <button 
                onClick={() => router.push("/pricing")}
                className="mt-3 w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg"
              >
                Upgrade to Premium
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Notes" value={data.stats.totalGenerated} />
          <StatCard label="Time Saved" value={`${data.stats.timeSavedHours}h`} />
          <StatCard label="Refinements" value={data.stats.totalEdits} />
          <StatCard label="Exports" value={data.stats.totalExports} />
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link 
            href="/myNotes/lessonNote"
            className="bg-card border p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <Zap className="text-primary mb-2" size={24} />
            <p className="font-bold">Generate Note</p>
            <p className="text-xs text-muted-foreground">Create new lesson</p>
          </Link>

          <Link 
            href="/myNotes/scheme"
            className="bg-card border p-4 rounded-lg hover:bg-accent transition-colors"
          >
            <BookOpen className="text-emerald-500 mb-2" size={24} />
            <p className="font-bold">My Scheme</p>
            <p className="text-xs text-muted-foreground">View curriculum</p>
          </Link>

          <Link 
            href="/pricing"
            className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-lg text-white"
          >
            <Crown className="mb-2" size={24} />
            <p className="font-bold">Upgrade</p>
            <p className="text-xs opacity-90">Unlock premium</p>
          </Link>
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
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredNotes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note: any) => (
                <div 
                  key={note.id} 
                  className="border rounded-lg p-4 hover:bg-accent transition-colors"
                >
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">
                    {note.gradeLevel}
                  </span>
                  
                  <h3 className="font-bold mt-3 mb-1 line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-primary mb-3">{note.subject}</p>
                  
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      {note.wordCount || 0} words
                    </span>
                    <Link 
                      href={`/myNotes/lessonNote?topic=${note.schemeSubTopicId}`}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Eye size={12} />
                      View
                    </Link>
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
                <Link 
                  href="/myNotes/lessonNote" 
                  className="text-primary text-sm font-bold hover:underline"
                >
                  Generate your first note
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple Stat Card
function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-card border p-4 rounded-lg">
      <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}