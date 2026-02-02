"use client";

import { useEffect, useState, useCallback, useRef, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Save, Eye, ChevronLeft, CheckCircle2, 
  Trash2, Plus, GripVertical, BookOpen, AlertCircle,
  ArrowUp, ChevronDown, ChevronUp, WifiOff, HardDrive, FileText
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/app/loading";

interface WeekData {
  id: string; // ✅ FIX: Unique stable ID
  weekNumber: number | string;
  topicTitle: string;
  content: string;
}

interface LocalBackup {
  weeks: WeekData[];
  timestamp: number;
  version: string;
}

const OPTIONAL_CONTENT_TOPICS = [
  "midterm break", "mid-term break", "midterm test", "mid-term test",
  "revision", "examination", "exam", "test", "break", "holiday", "closing"
];

const SOW_BACKUP_KEY = "sow_edit_backup_v1";
const BACKUP_VERSION = "1.0";

// ✅ Helper: Generate unique ID
function generateId(): string {
  return crypto.randomUUID();
}

// ✅ OPTIMIZATION: Memoized Week Card Component
const WeekCard = memo(({ 
  week, 
  idx, 
  onUpdate, 
  onDelete,
  isOptionalContent 
}: { 
  week: WeekData; 
  idx: number;
  onUpdate: (index: number, field: keyof WeekData, value: string | number) => void;
  onDelete: (index: number) => void;
  isOptionalContent: (title: string) => boolean;
}) => {
  const contentOptional = isOptionalContent(week.topicTitle);
  const isWeekDone = week.topicTitle.trim() && (week.content.trim() || contentOptional);

  return (
    <Card className={`border-l-4 transition-all w-full ${isWeekDone ? 'border-l-green-500' : 'border-l-amber-500'}`}>
      <CardHeader className="py-2.5 sm:py-3 px-3 sm:px-4 bg-muted/20 flex flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <span className="text-[10px] sm:text-xs font-bold uppercase">Week</span>
          <Input 
            type="number" 
            value={week.weekNumber} 
            onChange={(e) => onUpdate(idx, "weekNumber", e.target.value)}
            className="w-14 sm:w-16 h-7 sm:h-8 text-center font-bold text-sm"
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(idx)} 
          className="text-destructive h-7 sm:h-8 px-2 sm:px-3 flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] sm:text-xs font-semibold uppercase">Topic</label>
            {!week.topicTitle.trim() && (
              <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                Required
              </Badge>
            )}
          </div>
          <Input 
            value={week.topicTitle} 
            onChange={(e) => onUpdate(idx, "topicTitle", e.target.value)}
            placeholder="Topic Title..."
            className={`text-sm sm:text-base w-full ${!week.topicTitle.trim() ? "border-amber-300 bg-amber-50/20" : ""}`}
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] sm:text-xs font-semibold uppercase">
              Content {contentOptional && <span className="text-muted-foreground">(Optional)</span>}
            </label>
            {!contentOptional && !week.content.trim() && (
              <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                Required
              </Badge>
            )}
          </div>
          <Textarea 
            value={week.content} 
            onChange={(e) => onUpdate(idx, "content", e.target.value)}
            placeholder={contentOptional ? "Optional for this topic" : "Details..."}
            className={`text-sm sm:text-base w-full ${!contentOptional && !week.content.trim() ? "border-amber-300 bg-amber-50/20 min-h-[80px] sm:min-h-[100px]" : "min-h-[80px] sm:min-h-[100px]"}`}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
});

WeekCard.displayName = "WeekCard";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function EditingSchemeOfWorkPage() {
  const router = useRouter();
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [localBackupInfo, setLocalBackupInfo] = useState<{ timestamp: number; weeksCount: number } | null>(null);

  const debouncedWeeks = useDebounce(weeks, 300);

  // ✅ Auto-backup to localStorage
  useEffect(() => {
    if (weeks.length > 0 && hasChanges) {
      try {
        const backup: LocalBackup = {
          weeks,
          timestamp: Date.now(),
          version: BACKUP_VERSION
        };
        localStorage.setItem(SOW_BACKUP_KEY, JSON.stringify(backup));
        
        setLocalBackupInfo({
          timestamp: backup.timestamp,
          weeksCount: weeks.length
        });
      } catch (error) {
        console.error("Failed to backup to localStorage:", error);
      }
    }
  }, [weeks, hasChanges]);

  // ✅ Load from DB with smart backup resolution
  const loadFromDb = useCallback(async () => {
    setLoading(true);
    setNetworkError(false);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch("/api/scheme/currentSOW", {
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load`);
      const data = await res.json();
      
      const extractedText = data.scheme?.sowExtractedText || data.scheme?.extractedText;
      let serverWeeks: WeekData[] = [];

      if (data.success && extractedText) {
        try {
          const parsed = JSON.parse(extractedText);
          serverWeeks = Array.isArray(parsed) ? parsed.map((week: any) => ({
            id: week.id || generateId(), // ✅ FIX: Ensure ID exists
            weekNumber: week.weekNumber || week.week || 1,
            topicTitle: week.topicTitle || week.topic || "",
            content: week.content || week.topicContent || "",
          })) : [];
        } catch (parseError) {
          console.error("Server JSON parse error:", parseError);
        }
      }

      // Check for local backup
      try {
        const localBackupRaw = localStorage.getItem(SOW_BACKUP_KEY);
        
        if (localBackupRaw) {
          const localBackup: LocalBackup = JSON.parse(localBackupRaw);
          const backupAge = Date.now() - localBackup.timestamp;
          const backupAgeMinutes = Math.floor(backupAge / 60000);
          
          if (localBackup.weeks && localBackup.weeks.length > 0) {
            
            if (serverWeeks.length === 0 || !serverWeeks.some(w => w.topicTitle.trim())) {
              toast.success(" Restored from local backup", {
                description: `Found ${localBackup.weeks.length} weeks saved ${backupAgeMinutes}m ago`
              });
              setWeeks(localBackup.weeks);
              setHasChanges(true);
              setLocalBackupInfo({
                timestamp: localBackup.timestamp,
                weeksCount: localBackup.weeks.length
              });
              setLoading(false);
              return;
            }
            
            const serverHasData = serverWeeks.length > 0 && serverWeeks.some(w => w.topicTitle.trim());
            
            if (serverHasData) {
              toast.info(" Unsaved work found!", {
                description: `Local backup (${localBackup.weeks.length} weeks, ${backupAgeMinutes}m old)`,
                duration: 15000,
                action: {
                  label: "Restore Local",
                  onClick: () => {
                    setWeeks(localBackup.weeks);
                    setHasChanges(true);
                    setLocalBackupInfo({
                      timestamp: localBackup.timestamp,
                      weeksCount: localBackup.weeks.length
                    });
                    toast.success("Restored from local backup");
                  }
                },
                cancel: {
                  label: "Use Server Data",
                  onClick: () => {
                    localStorage.removeItem(SOW_BACKUP_KEY);
                    setLocalBackupInfo(null);
                    toast.info("Using server data. Local backup cleared.");
                  }
                }
              });
            }
          }
        }
      } catch (backupError) {
        console.error("Error reading local backup:", backupError);
      }

      if (serverWeeks.length > 0) {
        setWeeks(serverWeeks);
      } else {
        setWeeks([{ id: generateId(), weekNumber: 1, topicTitle: "", content: "" }]);
      }
      
    } catch (err: any) {
      console.error("Load error:", err);
      
      if (err.name === 'AbortError') {
        setNetworkError(true);
        
        try {
          const localBackupRaw = localStorage.getItem(SOW_BACKUP_KEY);
          if (localBackupRaw) {
            const localBackup: LocalBackup = JSON.parse(localBackupRaw);
            toast.warning("Network timeout. Using local backup.", {
              icon: <WifiOff className="h-4 w-4" />,
              action: {
                label: "Retry Server",
                onClick: () => loadFromDb()
              }
            });
            setWeeks(localBackup.weeks);
            setHasChanges(true);
            setLocalBackupInfo({
              timestamp: localBackup.timestamp,
              weeksCount: localBackup.weeks.length
            });
            setLoading(false);
            return;
          }
        } catch (backupError) {
          console.error("Failed to load backup after network error:", backupError);
        }
        
        toast.error("Network timeout. Please check your connection.", {
          action: {
            label: "Retry",
            onClick: () => loadFromDb()
          }
        });
      }
      
      setWeeks([{ id: generateId(), weekNumber: 1, topicTitle: "", content: "" }]);
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
    setWeeks(prev => [...prev, { 
      id: generateId(), // ✅ FIX: Generate unique ID
      weekNumber: nextNum, 
      topicTitle: "", 
      content: "" 
    }]);
    setHasChanges(true);
    toast.success(`Week ${nextNum} added`);
    
    setTimeout(() => {
      if (mainContentRef.current) {
        window.scrollTo({
          top: mainContentRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 150);
  }, [weeks]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isOptionalContentTopic = useCallback((topicTitle: string): boolean => {
    const normalized = topicTitle.toLowerCase().trim();
    return OPTIONAL_CONTENT_TOPICS.some(keyword => normalized.includes(keyword));
  }, []);

  const handleSaveWithRetry = async (attempt = 0): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch("/api/scheme/saveEdited", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Failed to save");
      }
      
      return true;
    } catch (err: any) {
      console.error(`Save attempt ${attempt + 1} failed:`, err);
      
      if (attempt < 2) {
        const delay = Math.pow(2, attempt) * 1000;
        toast.loading(`Retrying... (${attempt + 2}/3)`, { duration: delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        return handleSaveWithRetry(attempt + 1);
      }
      
      throw err;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const optimisticToast = toast.loading("Saving your scheme...");
    
    try {
      await handleSaveWithRetry();
      
      localStorage.removeItem(SOW_BACKUP_KEY);
      setLocalBackupInfo(null);
      
      toast.success("Scheme saved successfully! ✨", { 
        id: optimisticToast,
        description: "Local backup cleared"
      });
      setHasChanges(false);
      
      loadFromDb();
    } catch (err: any) {
      toast.error("Save failed. Your work is safely backed up locally.", {
        id: optimisticToast,
        icon: <HardDrive className="h-4 w-4" />,
        action: {
          label: "Retry",
          onClick: () => handleSave()
        }
      });
    } finally {
      setSaving(false);
    }
  };

  // ✅ FIX: Remove setTimeout - wait for save completion
  const handleSaveAndView = async () => {
    if (hasChanges) {
      setSaving(true);
      const optimisticToast = toast.loading("Saving...");
      
      try {
        // ✅ Wait for save to complete
        await handleSaveWithRetry();
        
        localStorage.removeItem(SOW_BACKUP_KEY);
        setLocalBackupInfo(null);
        
        toast.success("Saved! Redirecting...", { id: optimisticToast });
        setHasChanges(false);
        
        // ✅ Only redirect after successful save - NO setSaving(false)
        router.push("/community/schemeOfWork/viewSow");
      } catch (err: any) {
        toast.error("Save failed. Please try again.", { id: optimisticToast });
        setSaving(false); // ✅ Only reset if save fails
      }
    } else {
      router.push("/community/schemeOfWork/viewSow");
    }
  };

  // ✅ ENHANCED: Stats with character count and detail level
  const stats = useMemo(() => {
    const completed = debouncedWeeks.filter(w => {
      const hasTitle = w.topicTitle.trim().length > 0;
      const hasContent = w.content.trim().length > 0;
      const contentOptional = isOptionalContentTopic(w.topicTitle);
      return hasTitle && (hasContent || contentOptional);
    }).length;

    const rate = debouncedWeeks.length > 0 ? Math.round((completed / debouncedWeeks.length) * 100) : 0;
    const complete = rate === 100;

    // ✅ NEW: Total character count
    const totalChars = debouncedWeeks.reduce((sum, w) => {
      return sum + w.topicTitle.length + w.content.length;
    }, 0);

    // ✅ NEW: Average detail level per week
    const avgCharsPerWeek = debouncedWeeks.length > 0 
      ? Math.round(totalChars / debouncedWeeks.length) 
      : 0;

    // ✅ NEW: Detail quality indicator
    const detailQuality = avgCharsPerWeek < 50 
      ? "Low" 
      : avgCharsPerWeek < 150 
        ? "Good" 
        : "Excellent";

    return { 
      completedWeeksCount: completed, 
      completionRate: rate, 
      isComplete: complete,
      totalChars,
      avgCharsPerWeek,
      detailQuality
    };
  }, [debouncedWeeks, isOptionalContentTopic]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 sm:gap-4 p-4">
        <Loading />
        {networkError && (
          <div className="text-center space-y-2">
            <WifiOff className="h-7 w-7 sm:h-8 sm:w-8 mx-auto text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground">Slow connection detected</p>
            <Button variant="outline" size="sm" onClick={loadFromDb} className="h-9 text-xs sm:text-sm">
              Retry Connection
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-sm border-b shadow-sm w-full">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            <div className="flex items-center gap-2 flex-shrink min-w-0">
              <Button 
                variant="ghost" 
                onClick={() => router.push("/community/schemeOfWork")} 
                size="icon" 
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <h1 className="text-sm sm:text-base font-bold whitespace-nowrap truncate">Edit Scheme</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {localBackupInfo && (
                <Badge variant="secondary" className="text-[9px] sm:text-[10px] gap-0.5 sm:gap-1 px-1.5 sm:px-2">
                  <HardDrive className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Auto-saved</span>
                </Badge>
              )}
              <Badge variant={hasChanges ? "destructive" : "outline"} className="text-[9px] sm:text-[10px] whitespace-nowrap px-1.5 sm:px-2">
                {hasChanges ? "UNSAVED" : "SYNCED"}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setHeaderCollapsed(!headerCollapsed)}
                className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
              >
                {headerCollapsed ? <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </Button>
            </div>
          </div>

          <div 
            className={`transition-all duration-300 ease-in-out ${
              headerCollapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'
            } overflow-hidden`}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 pb-3 w-full">
              <StatsCard label="Weeks" value={weeks.length} />
              <StatsCard label="Done" value={stats.completedWeeksCount} />
              <StatsCard label="Progress" value={`${stats.completionRate}%`} />
              <StatsCard 
                label="Detail" 
                value={stats.detailQuality}
                subtitle={`${stats.avgCharsPerWeek} chars/week`}
                icon={<FileText className="h-3 w-3" />}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={mainContentRef}
        className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 overflow-x-hidden"
        style={{ paddingBottom: '180px' }}
      >
        {weeks.length === 1 && !weeks[0].topicTitle && (
          <Card className="border-2 border-dashed border-primary/50 bg-primary/5 w-full">
            <CardContent className="p-3 sm:p-4 md:p-6 text-center space-y-2">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 mx-auto text-primary mb-1 sm:mb-2" />
              <h3 className="font-bold text-sm sm:text-base md:text-lg">Create Your Scheme of Work</h3>
              <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Start by filling in Week 1 below. Your work is automatically saved to your device.
              </p>
              {localBackupInfo && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs gap-1 mt-2">
                  <HardDrive className="h-3 w-3" />
                  Auto-backup enabled
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* ✅ FIX: Use stable unique ID as key */}
        {weeks.map((week, idx) => (
          <WeekCard
            key={week.id}
            week={week}
            idx={idx}
            onUpdate={updateItem}
            onDelete={deleteWeek}
            isOptionalContent={isOptionalContentTopic}
          />
        ))}
        
        <Button 
          variant="outline" 
          onClick={addWeek} 
          className="w-full border-dashed py-6 sm:py-8 text-sm sm:text-base"
        >
          <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add Week
        </Button>
      </main>

      <Button 
        size="icon" 
        variant="secondary" 
        onClick={scrollToTop} 
        className="fixed right-3 sm:right-4 bottom-28 sm:bottom-32 rounded-full shadow-lg h-10 w-10 sm:h-11 sm:w-11 z-40"
      >
        <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-2xl z-50 w-full">
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {!stats.isComplete && (
            <p className="text-center text-[9px] sm:text-[10px] md:text-xs text-amber-600 font-bold mb-1.5 sm:mb-2 flex items-center justify-center gap-0.5 sm:gap-1">
              <AlertCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> 
              <span className="hidden xs:inline">Complete all required fields</span>
              <span className="xs:hidden">Complete all fields</span>
            </p>
          )}
          
          <div className="flex gap-2 sm:gap-3 w-full">
            <Button 
              onClick={handleSave}
              disabled={saving || !stats.isComplete}
              variant={stats.isComplete && hasChanges ? "default" : "outline"}
              className={`flex-1 min-w-0 h-12 sm:h-14 font-bold text-xs sm:text-sm md:text-base transition-all ${
                stats.isComplete && hasChanges ? "bg-green-600 hover:bg-green-700 text-white" : ""
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : stats.isComplete ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasChanges ? "Save Changes" : "Saved"}
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {stats.completionRate}% Complete
                </>
              )}
            </Button>

            <Button 
              onClick={handleSaveAndView}
              disabled={saving || !stats.isComplete}
              className="h-12 sm:h-14 px-3 sm:px-4 md:px-6 font-bold text-xs sm:text-sm md:text-base flex-shrink-0"
            >
              {saving ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </>
              )}
            </Button>
          </div>

          {hasChanges && stats.isComplete && localBackupInfo && (
            <p className="text-center text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2 flex items-center justify-center gap-1">
              <HardDrive className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden xs:inline">Auto-saved</span>
              <span>{Math.floor((Date.now() - localBackupInfo.timestamp) / 60000)}m ago</span>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

// ✅ ENHANCED: StatsCard with optional subtitle and icon
const StatsCard = memo(({ 
  label, 
  value, 
  subtitle,
  icon 
}: { 
  label: string; 
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Card className="bg-card/50 shadow-sm w-full">
      <CardContent className="p-2 sm:p-2.5 text-center">
        <div className="flex items-center justify-center gap-1 mb-0.5">
          {icon}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-black uppercase leading-tight">
            {label}
          </p>
        </div>
        <p className="text-base sm:text-lg font-bold leading-tight">{value}</p>
        {subtitle && (
          <p className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

StatsCard.displayName = "StatsCard";