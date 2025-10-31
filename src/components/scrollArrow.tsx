// src/components/ScrollArrow.tsx
"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollArrow() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (top: boolean) =>
    window.scrollTo({ top: top ? 0 : document.body.scrollHeight, behavior: "smooth" });

  if (!show) return null;

  return (
    <div className="fixed right-6 z-50 flex flex-col gap-2" 
         style={{ top: '50%', transform: 'translateY(-50%)' }}>
      <Button 
        size="icon" 
        onClick={() => scrollTo(true)}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        size="icon" 
        onClick={() => scrollTo(false)}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );
}