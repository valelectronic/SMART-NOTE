"use client";

import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { UserProvider, ProfileData } from "@/context/user.context";
import { Toaster } from "sonner";

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
         <Toaster
          richColors
          position="top-right"
          closeButton
          duration={4000}
        />
      
      </UserProvider>
    </ThemeProvider>
  );
}
