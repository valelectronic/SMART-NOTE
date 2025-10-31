"use client";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // avoids hydration flicker

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className=" rounded-full bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
      aria-label="Toggle theme"
    >
     {theme === "dark" ? (
  <Sun className="h-5 w-5 text-background" />   // ← light icon on dark bg
) : (
  <Moon className="h-5 w-5 text-background" />  // ← dark icon on light bg
)}
    </Button>
  );
}