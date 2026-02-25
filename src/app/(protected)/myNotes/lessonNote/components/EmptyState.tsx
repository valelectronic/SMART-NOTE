"use client";

import { useState, useEffect } from "react";
import { BookOpen, Menu } from "lucide-react";

export function EmptyState() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-[70vh] sm:h-[75vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-8 sm:p-12 rounded-full bg-card shadow-xl border border-border mb-6 sm:mb-8">
        <BookOpen size={64} className="text-primary/20 sm:w-20 sm:h-20" />
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
        Ready to Create
      </h2>
      
      <p className="text-muted-foreground max-w-md leading-relaxed text-sm sm:text-base">
        Select a topic from {isMobile ? 'the menu' : 'the sidebar'} to generate your lesson note.
      </p>
      
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="mt-8 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-primary/90 transition-all shadow-lg"
        >
          <Menu size={20} />
          <span>Open Menu</span>
        </button>
      )}
    </div>
  );
}