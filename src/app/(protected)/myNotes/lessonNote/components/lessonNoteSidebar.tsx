"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar, FileText, X, Menu, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";

interface Props {
  weeks: any[];
  selectedTopic: any;
  onSelectTopic: (topic: any) => void;
  currentTerm: string;
  loading: boolean;
}

export function LessonNoteSidebar({ weeks, selectedTopic, onSelectTopic, currentTerm, loading }: Props) {
  const [openWeek, setOpenWeek] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (weeks.length > 0) setOpenWeek(weeks[0].weekNumber);
  }, [weeks]);

  const selectTopic = (topic: any) => {
    onSelectTopic(topic);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-primary text-primary-foreground p-3 rounded-xl shadow-lg"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-80 max-w-[85vw] bg-card border-r border-border 
        flex flex-col shadow-2xl lg:shadow-none
        transform transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:mt-0 mt-16
      `}>
        {/* Header */}
        <div className="p-5 border-b border-border bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground/10 p-2 rounded-lg">
                <BookOpen size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">My Scheme</h2>
                <p className="text-xs opacity-80 uppercase">{currentTerm} {new Date().getFullYear()}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-primary-foreground/20">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Weeks list */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <div className="animate-spin mb-3"><Calendar size={32} className="text-primary" /></div>
              <p className="text-sm">Loading...</p>
            </div>
          ) : weeks.length === 0 ? (
            <div className="text-center p-8">
              <Calendar size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-foreground font-medium">No Scheme</p>
            </div>
          ) : (
            weeks.map((week) => (
              <div key={week.weekNumber} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                <button
                  onClick={() => setOpenWeek(openWeek === week.weekNumber ? null : week.weekNumber)}
                  className={`w-full flex items-center justify-between p-4 transition-all ${
                    openWeek === week.weekNumber ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${openWeek === week.weekNumber ? "bg-primary/20" : "bg-muted"}`}>
                      <Calendar size={16} />
                    </div>
                    <span className="font-bold text-sm">Week {week.weekNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {week.topics?.length || 0} topic{week.topics?.length !== 1 ? 's' : ''}
                    </span>
                    {openWeek === week.weekNumber ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {openWeek === week.weekNumber && week.topics && (
                  <div className="bg-muted/50 divide-y divide-border">
                    {week.topics.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => selectTopic(t)}
                        className={`w-full text-left p-4 text-sm flex items-start gap-3 hover:bg-card ${
                          selectedTopic?.id === t.id ? "bg-card text-primary border-l-4 border-primary font-medium" : ""
                        }`}
                      >
                        <div className={`mt-1 w-2 h-2 rounded-full ${selectedTopic?.id === t.id ? "bg-primary" : "bg-muted-foreground"}`} />
                        <div className="flex-1">
                          <p className="line-clamp-2">{t.topicTitle}</p>
                          {t.notesGenerated && (
                            <div className="flex items-center gap-1 mt-2">
                              <CheckCircle2 size={12} className="text-primary" />
                              <span className="text-xs text-primary">Generated</span>
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
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <FileText size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-foreground">Quick Tip</p>
              <p className="text-xs text-muted-foreground">Free: 2 edits. Premium: 5 edits + regenerate.</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}