"use client";

import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with simple pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          <Image
            src="/logo.jpg"
            alt="App Logo"
            width={80}
            height={80}
            className="rounded-full relative z-10"
          />
        </div>

        {/* Loading text with subtle animation */}
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            Getting things ready
          </p>
          <p className="text-sm text-muted-foreground">
            Loading your teaching resources...
          </p>
        </div>

        {/* Simple progress indicator */}
        <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}