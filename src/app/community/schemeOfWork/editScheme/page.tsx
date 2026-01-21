"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Save, Eye, ChevronLeft, CheckCircle2, 
  Trash2, Plus, GripVertical, BookOpen, AlertCircle,
  ArrowUp, ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";

interface WeekData {
  weekNumber: number | string;
  topicTitle: string;
  content: string;
}

const OPTIONAL_CONTENT_TOPICS = [
  "midterm break", "mid-term break", "midterm test", "mid-term test",
  "revision", "examination", "exam", "test", "break", "holiday"
];

export default function EditingSchemeOfWorkPage() {
  const router = useRouter();
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  useEffect(() => {
    const handleScroll = () => setShowScrollButtons(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadFromDb = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scheme/currentSOW");
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load`);
      const data = await res.json();
      const extractedText = data.scheme?.sowExtractedText || data.scheme?.extractedText;

      if (data.success && extractedText) {
        const parsed = JSON.parse(extractedText);
        const transformedWeeks = Array.isArray(parsed) ? parsed.map((week: any) => ({
          weekNumber: week.weekNumber || week.week || 1,
          topicTitle: week.topicTitle || week.topic || "",
          content: week.content || week.topicContent || "",
        })) : [];
        setWeeks(transformedWeeks);
        setError(null);
      } else {
        setError("No scheme data found.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheme");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const updateItem = useCallback((index: number, field: keyof WeekData, value: string | number) => {
    setWeeks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasChanges(true);
  }, []);

  const deleteWeek = useCallback((index: number) => {
    if (weeks.length <= 1) return toast.error("Cannot delete the last week");
    setWeeks(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
    toast.success("Week deleted");
  }, [weeks.length]);

  const addWeek = useCallback(() => {
    const nextNum = weeks.length > 0 ? Math.max(...weeks.map(w => Number(w.weekNumber))) + 1 : 1;
    setWeeks(prev => [...prev, { weekNumber: nextNum, topicTitle: "", content: "" }]);
    setHasChanges(true);
    toast.success(`Week ${nextNum} added`);
  }, [weeks]);

  const isOptionalContentTopic = (topicTitle: string): boolean => {
    const normalized = topicTitle.toLowerCase().trim();
    return OPTIONAL_CONTENT_TOPICS.some(keyword => normalized.includes(keyword));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/scheme/saveEdited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks }), 
      });
      if (!response.ok) throw new Error("Failed to save");
      
      toast.success("Scheme saved successfully!");
      setSaveSuccessful(true);
      setHasChanges(false);
      
      // Reload data from DB to ensure UI is synced
      await loadFromDb();
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Derived Stats (Calculated once per render)
  const completedWeeksCount = weeks.filter(w => {
    const hasTitle = w.topicTitle.trim().length > 0;
    const hasContent = w.content.trim().length > 0;
    const contentOptional = isOptionalContentTopic(w.topicTitle);
    return hasTitle && (hasContent || contentOptional);
  }).length;

  const completionRate = weeks.length > 0 ? Math.round((completedWeeksCount / weeks.length) * 100) : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading /></div>;
  if (error) return <div className="p-10 text-center"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="min-h-screen bg-background pb-32" ref={topRef}>
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.back()} size="icon"><ChevronLeft /></Button>
              <h1 className="text-lg font-bold">Review Curriculum</h1>
            </div>
            <Badge variant={hasChanges ? "destructive" : "outline"}>{hasChanges ? "UNSAVED" : "SYNCED"}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatsCard label="Total" value={weeks.length} />
            <StatsCard label="Done" value={completedWeeksCount} />
            <StatsCard label="Progress" value={`${completionRate}%`} />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {weeks.map((week, idx) => {
          const contentOptional = isOptionalContentTopic(week.topicTitle);
          const isWeekDone = week.topicTitle.trim() && (week.content.trim() || contentOptional);

          return (
            <Card key={idx} className={`border-l-4 transition-all ${isWeekDone ? 'border-l-green-500' : 'border-l-amber-500'}`}>
              <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase">Week</span>
                  <Input 
                    type="number" 
                    value={week.weekNumber} 
                    onChange={(e) => updateItem(idx, "weekNumber", e.target.value)}
                    className="w-16 h-8 text-center font-bold"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteWeek(idx)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase">Topic</label>
                    {!week.topicTitle.trim() && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Required</Badge>}
                  </div>
                  <Input 
                    value={week.topicTitle} 
                    onChange={(e) => updateItem(idx, "topicTitle", e.target.value)}
                    placeholder="Topic Title..."
                    className={!week.topicTitle.trim() ? "border-amber-300 bg-amber-50/20" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase">Content {contentOptional && "(Optional)"}</label>
                    {!contentOptional && !week.content.trim() && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Required</Badge>}
                  </div>
                  <Textarea 
                    value={week.content} 
                    onChange={(e) => updateItem(idx, "content", e.target.value)}
                    placeholder={contentOptional ? "Optional for this topic" : "Details..."}
                    className={!contentOptional && !week.content.trim() ? "border-amber-300 bg-amber-50/20 min-h-[100px]" : "min-h-[100px]"}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Button variant="outline" onClick={addWeek} className="w-full border-dashed py-8"><Plus className="mr-2" /> Add Week</Button>
      </main>

      {showScrollButtons && (
        <div className="fixed right-4 bottom-28 flex flex-col gap-2">
          <Button size="icon" variant="secondary" onClick={scrollToTop} className="rounded-full shadow-lg"><ArrowUp /></Button>
          <Button size="icon" variant="secondary" onClick={scrollToBottom} className="rounded-full shadow-lg"><ArrowDown /></Button>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          {!saveSuccessful ? (
            <div className="space-y-2">
              {completionRate < 100 && (
                <p className="text-center text-[10px] text-amber-600 font-bold animate-pulse flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> FILL ALL REQUIRED FIELDS TO SAVE
                </p>
              )}
              <div className="flex gap-3">
                <Button 
                  className={`flex-1 h-12 font-bold transition-all ${completionRate === 100 ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={handleSave}
                  disabled={saving || completionRate < 100}
                >
                  {saving ? <Loader2 className="animate-spin mr-2" /> : completionRate === 100 ? <CheckCircle2 className="mr-2" /> : <Save className="mr-2" />}
                  {completionRate === 100 ? "Save Changes" : `Progress: ${completionRate}%`}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/community/schemeOfWork/viewSow")} 
                  className="h-12"
                >
                  <Eye className="mr-2 h-4 w-4" /> View
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSaveSuccessful(false)} className="flex-1">Continue Editing</Button>
              <Button onClick={() => router.push("/community/schemeOfWork/viewSow")} className="flex-1"><Eye className="mr-2" /> View Scheme</Button>
            </div>
          )}
        </div>
      </footer>
      <div ref={bottomRef} />
    </div>
  );
}

function StatsCard({ label, value }: { label: string, value: string | number }) {
  return (
    <Card className="bg-card/50"><CardContent className="p-3 text-center">
      <p className="text-[10px] text-muted-foreground font-black uppercase">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </CardContent></Card>
  );
}