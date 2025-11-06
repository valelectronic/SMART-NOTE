"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { UserProvider, ProfileData } from "@/context/user.context";

interface ClientProvidersProps {
  children: ReactNode;
  initialProfile: ProfileData;
}

export default function ClientProviders({ children, initialProfile }: ClientProvidersProps) {
  return (
    // ThemeProvider should wrap the entire app (outermost)
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* UserProvider wraps all children that need profile data */}
      <UserProvider initialData={initialProfile}>
        {children}
        {/* Toast notifications */}
        <Toaster richColors position="top-right" />
      </UserProvider>
    </ThemeProvider>
  );
}
