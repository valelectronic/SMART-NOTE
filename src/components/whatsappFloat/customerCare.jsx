"use client";

import { X, Headphones } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function CustomerCare() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace with your actual WhatsApp business number (NO + sign, just numbers)
  const whatsappNumber = "2349063087928";
  const message = "Hello! I need help with SmartNote.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[9999] flex flex-row items-center gap-3 pointer-events-none">
      {/* Info Card - Shows when button is clicked */}
      {isOpen && (
        <Card className="ml-20 md:ml-24 w-72 shadow-2xl animate-in slide-in-from-left-5 duration-300 pointer-events-auto border-2">
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Customer Support</CardTitle>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online Now
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4 pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Hi! 👋 How can we help you today?
            </p>
            <Button
              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
              onClick={() => window.open(whatsappUrl, "_blank")}
            >
              <MessageCircleIcon className="mr-2 h-4 w-4" />
              Chat on WhatsApp
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              ⚡ We typically reply within 5 minutes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Customer Care Button with Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group pointer-events-auto ml-0"
        aria-label="Contact customer support"
      >
        {/* Glowing effect */}
        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-40 group-hover:opacity-60 animate-pulse pointer-events-none" />
        
        {/* Avatar Container */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 border-4 border-white overflow-hidden">
          {/* Customer Service Representative SVG */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full"
            fill="none"
          >
            {/* Background with gradient effect */}
            <defs>
              <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="shirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            
            {/* Background circle with subtle gradient */}
            <circle cx="50" cy="50" r="50" fill="url(#bgGradient)" />
            
            {/* Shoulders with gradient */}
            <path 
              d="M 20 85 Q 30 70, 50 70 Q 70 70, 80 85 L 80 100 L 20 100 Z" 
              fill="url(#shirtGradient)"
            />
            
            {/* Neck */}
            <rect x="43" y="55" width="14" height="15" rx="2" fill="#f59e0b" />
            
            {/* Head */}
            <circle cx="50" cy="45" r="18" fill="#fbbf24" />
            
            {/* Hair */}
            <path 
              d="M 32 40 Q 32 27, 50 27 Q 68 27, 68 40 L 68 48 Q 68 35, 50 35 Q 32 35, 32 48 Z" 
              fill="#1f2937"
            />
            
            {/* Headset band */}
            <path 
              d="M 30 40 Q 30 25, 50 25 Q 70 25, 70 40" 
              stroke="#1f2937"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Left earpiece */}
            <rect x="26" y="38" width="6" height="10" rx="3" fill="#1f2937" />
            
            {/* Right earpiece */}
            <rect x="68" y="38" width="6" height="10" rx="3" fill="#1f2937" />
            
            {/* Microphone arm */}
            <path 
              d="M 26 43 Q 20 48, 22 55" 
              stroke="#1f2937"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Microphone */}
            <circle cx="23" cy="57" r="3" fill="#1f2937" />
            
            {/* Eyes */}
            <circle cx="43" cy="43" r="2" fill="#1f2937" />
            <circle cx="57" cy="43" r="2" fill="#1f2937" />
            
            {/* Smile */}
            <path 
              d="M 42 50 Q 50 54, 58 50" 
              stroke="#1f2937"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Online indicator with pulse */}
        <div className="absolute top-1 right-1 w-4 h-4 md:w-5 md:h-5 bg-green-500 border-3 border-white rounded-full animate-pulse pointer-events-none shadow-lg">
          <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
        </div>
      </button>
    </div>
  );
}

// WhatsApp SVG Icon
function MessageCircleIcon(props) {
  return (
    <svg className={props.className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}