"use client";

import { useState, useEffect, Suspense } from "react";
import { LessonNoteViewer } from "@/components/lessonNoteViewer/lessonNoteViewer";
import { 
  Loader2, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  Send, 
  BookOpen,
  Menu,
  X,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function TestDashboard() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);
  const [generatedNote, setGeneratedNote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<string>("First Term");

  // Detect mobile on mount (fixes window is not defined)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load grouped topics from the API and extract term info
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await fetch("/api/scheme/topics");
        const data = await res.json();
        if (Array.isArray(data)) {
          setWeeks(data);
          if (data.length > 0) {
            setOpenWeek(data[0].weekNumber);
            // Extract term from first week if available
            if (data[0].term) {
              setCurrentTerm(data[0].term);
            }
          }
        } else {
          setError("Failed to format scheme data.");
        }
      } catch (err) {
        setError("Could not connect to the server.");
      } finally {
        setInitialFetchLoading(false);
      }
    };
    loadTopics();
  }, []);

  const handleGenerate = async (isRefinement = false) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-lesson-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          subTopicId: selectedTopic.id,
          instruction: isRefinement ? instruction : undefined 
        }),
      });
      const result = await res.json();
      
      if (result.status === "success" || result.success) {
        setGeneratedNote(result.data);
        if (isRefinement) setInstruction(""); 
        if (isMobile) setSidebarOpen(false);
      } else {
        setError(result.error || "Generation failed. Try again.");
      }
    } catch (err) {
      setError("Network error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const selectTopic = (topic: any) => {
    setSelectedTopic(topic);
    setGeneratedNote(null);
    setError("");
    if (isMobile) setSidebarOpen(false);
  };

  // Sidebar Loading Component
  const SidebarLoadingSkeleton = () => (
    <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
      <Loader2 className="animate-spin mb-3 text-primary" size={32} />
      <p className="text-sm font-medium">Loading scheme...</p>
    </div>
  );

  // Main Content Loading Component
  const ContentLoadingSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 sm:py-32">
      <div className="relative mb-6">
        <Loader2 size={56} className="animate-spin text-primary opacity-20" />
        <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
      </div>
      <p className="font-bold text-foreground text-lg sm:text-xl text-center">
        Generating Your Note...
      </p>
      <p className="text-sm sm:text-base mt-2 max-w-md text-center leading-relaxed px-4 text-muted-foreground">
      We are crafting a professional, curriculum-aligned lesson note with Nigerian examples and past questions.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4">
        {['Writing Content', 'Adding Examples', 'Formatting'].map((step, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
              <div className={`w-3 h-3 bg-primary rounded-full ${i === 0 ? 'animate-pulse' : ''}`} />
            </div>
            <p className="text-xs font-medium text-foreground">{step}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      
      {/* MOBILE MENU BUTTON - Fixed positioning to avoid navbar overlap */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-primary text-primary-foreground p-3 rounded-xl shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* SIDEBAR OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 max-w-[85vw] bg-card border-r border-border 
        flex flex-col shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:mt-0 mt-16
      `}>
        {/* Header */}
        <div className="p-5 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/10 p-2 rounded-lg backdrop-blur-sm">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">My Scheme</h2>
                <p className="text-xs opacity-80 uppercase tracking-wide mt-0.5">
                  {currentTerm} {new Date().getFullYear()}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden bg-primary-foreground/10 p-2 rounded-lg hover:bg-primary-foreground/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Weeks Navigation with Suspense */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
          <Suspense fallback={<SidebarLoadingSkeleton />}>
            {initialFetchLoading ? (
              <SidebarLoadingSkeleton />
            ) : weeks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                  <Calendar size={32} className="text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">No Scheme Uploaded</p>
                <p className="text-muted-foreground text-sm">Upload your scheme of work to get started</p>
              </div>
            ) : (
              weeks.map((week) => (
                <div key={week.weekNumber} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow">
                  {/* Week Header */}
                  <button 
                    onClick={() => setOpenWeek(openWeek === week.weekNumber ? null : week.weekNumber)}
                    className={`
                      w-full flex items-center justify-between p-4 transition-all
                      ${openWeek === week.weekNumber 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted text-foreground"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-1.5 rounded-lg transition-colors
                        ${openWeek === week.weekNumber 
                          ? "bg-primary/20" 
                          : "bg-muted"
                        }
                      `}>
                        <Calendar size={16} className={openWeek === week.weekNumber ? "text-primary" : "text-muted-foreground"} />
                      </div>
                      <span className="font-bold text-sm">Week {week.weekNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full font-medium">
                        {week.topics.length} {week.topics.length === 1 ? 'topic' : 'topics'}
                      </span>
                      {openWeek === week.weekNumber ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                    </div>
                  </button>

                  {/* Topics List */}
                  {openWeek === week.weekNumber && (
                    <div className="bg-muted/50 divide-y divide-border">
                      {week.topics.map((t: any) => (
                        <button
                          key={t.id}
                          onClick={() => selectTopic(t)}
                          className={`
                            w-full text-left p-4 text-sm transition-all 
                            flex items-start gap-3 hover:bg-card group
                            ${selectedTopic?.id === t.id 
                              ? "bg-card text-primary border-l-4 border-primary font-medium" 
                              : "text-foreground hover:text-foreground"
                            }
                          `}
                        >
                          <div className={`
                            mt-1 flex-shrink-0 w-2 h-2 rounded-full transition-colors
                            ${selectedTopic?.id === t.id 
                              ? "bg-primary" 
                              : "bg-muted-foreground group-hover:bg-primary"
                            }
                          `} />
                          <div className="flex-1 min-w-0">
                            <p className="line-clamp-2 leading-relaxed">{t.topicTitle}</p>
                            {t.notesGenerated && (
                              <div className="flex items-center gap-1 mt-2">
                                <CheckCircle2 size={12} className="text-primary" />
                                <span className="text-xs text-primary font-medium">Note generated</span>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </Suspense>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground mb-1">Quick Tip</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Free tier: 2 corrections per note. Premium: 10 corrections + instant refinement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8 lg:py-12">
          <Suspense fallback={<ContentLoadingSkeleton />}>
            {selectedTopic ? (
              <div className="space-y-6 lg:space-y-8">
                
                {/* Topic Header Card */}
                <div className="bg-card p-6 lg:p-8 rounded-2xl shadow-sm border border-border">
                  <div className="flex flex-col gap-6">
                    {/* Topic Title & Meta */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase">
                          Week {selectedTopic.weekNumber}
                        </span>
                        <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-bold rounded-full uppercase">
                          Core Topic
                        </span>
                        {selectedTopic.notesGenerated && (
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            Generated
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                        {selectedTopic.topicTitle}
                      </h1>
                      {selectedTopic.topicContent && (
                        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-3xl">
                          {selectedTopic.topicContent}
                        </p>
                      )}
                    </div>
                    
                    {/* Generate Button */}
                    {!generatedNote && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleGenerate()}
                          disabled={loading}
                          className="
                            bg-primary hover:bg-primary/90 text-primary-foreground 
                            px-6 sm:px-8 py-4 rounded-xl font-bold 
                            flex items-center justify-center gap-3 
                            shadow-lg shadow-primary/20
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all hover:scale-[1.02] active:scale-95
                            text-sm sm:text-base
                          "
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              <span>Generate Lesson Note</span>
                            </>
                          )}
                        </button>
                        {selectedTopic.notesGenerated && (
                          <button
                            className="
                              border-2 border-border text-foreground 
                              px-6 sm:px-8 py-4 rounded-xl font-bold 
                              flex items-center justify-center gap-3 
                              hover:bg-muted transition-all
                              text-sm sm:text-base
                            "
                          >
                            <FileText size={20} />
                            <span>View Previous Note</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="bg-destructive/10 border-l-4 border-destructive p-4 sm:p-5 rounded-xl shadow-sm animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                      <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-destructive mb-1">Action Required</p>
                        <p className="text-sm text-destructive/90 leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Note Section */}
                {generatedNote && (
                  <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Note Viewer */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                      <Suspense fallback={<div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>}>
                        <LessonNoteViewer 
                          content={generatedNote.content} 
                          title={generatedNote.title} 
                        />
                      </Suspense>
                    </div>

                    {/* Refinement Panel */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-2xl border border-slate-700">
                      <div className="space-y-6">
                        
                        {/* Panel Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <Send size={24} className="text-primary" />
                            </div>
                            <span>Refine This Note</span>
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="bg-white/5 px-4 py-2 rounded-xl text-sm font-mono border border-white/10 backdrop-blur-sm">
                              <span className="text-slate-400">Edits:</span>{' '}
                              <span className={generatedNote.editCount >= 2 ? "text-destructive font-bold" : "text-primary font-bold"}>
                                {generatedNote.editCount}/2
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Info Banner */}
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
                          <Clock className="text-primary flex-shrink-0 mt-0.5" size={20} />
                          <p className="text-sm text-slate-100 leading-relaxed">
                            <span className="font-bold">Free Tier Limits:</span> Wait 5 minutes between refinements. 
                            Maximum 2 corrections per note. Upgrade to Premium for instant refinements and 10 corrections.
                          </p>
                        </div>
                        
                        {/* Instruction Input */}
                        <div className="space-y-3">
                          <label className="block text-sm font-bold text-slate-300">
                            What would you like to improve?
                          </label>
                          <textarea 
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder="Examples:&#10;• 'Add more Nigerian examples from Lagos State'&#10;• 'Simplify the calculation in Step 3'&#10;• 'Include 2 WAEC past questions from 2022'&#10;• 'Make the language simpler for SS1 students'"
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
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                          <button 
                            onClick={() => handleGenerate(true)}
                            disabled={loading || !instruction.trim() || generatedNote.editCount >= 2}
                            className="
                              bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold 
                              hover:bg-primary/90 disabled:bg-slate-700 disabled:text-slate-500
                              transition-all flex items-center justify-center gap-3 
                              shadow-lg shadow-primary/40 active:scale-95
                              disabled:cursor-not-allowed disabled:shadow-none
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
                          
                          {generatedNote.editCount >= 2 && (
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
                  </div>
                )}

                {/* Loading State - Uses Suspense ContentLoadingSkeleton */}
                {loading && !generatedNote && <ContentLoadingSkeleton />}
              </div>
            ) : (
              // Empty State
              <div className="h-[70vh] sm:h-[75vh] flex flex-col items-center justify-center text-center px-4">
                <div className="p-8 sm:p-12 rounded-full bg-card shadow-xl border border-border mb-6 sm:mb-8">
                  <BookOpen size={64} className="text-primary/20 sm:w-20 sm:h-20" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                  Ready to Create
                </h2>
                <p className="text-muted-foreground max-w-md leading-relaxed text-sm sm:text-base">
                  Select a topic from {isMobile ? 'the menu' : 'the sidebar'} to generate your next professional lesson note with Nigerian curriculum standards.
                </p>
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="mt-8 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-primary/90 transition-all shadow-lg"
                  >
                    <Menu size={20} />
                    <span>Open Scheme Menu</span>
                  </button>
                )}
              </div>
            )}
          </Suspense>
        </div>
      </main>
    </div>
  );
}