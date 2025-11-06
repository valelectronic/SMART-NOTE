// src/context/user-context.tsx (The context logic)
"use client";
import React , {createContext, useContext, useState, ReactNode} from "react";

// 1. Define the Profile Data Type
export type ProfileData = {
  fullName: string;
  fileUrl: string | null;
} | null;

// 2. Define the Context Type
interface UserContextType {
  profile: ProfileData;
  setProfile: (data: ProfileData) => void;
  updateAvatarUrl: (newUrl: string) => void;
}

// 3. Create the Context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

// 4. Create the Provider Component 
export function UserProvider({ children, initialData }: { 
    children: ReactNode;
    initialData: ProfileData;
}) {
  // Initialize state using the server data
  const [profile, setProfile] = useState<ProfileData>(initialData); 

  const updateAvatarUrl = (newUrl: string) => {
    if (profile) {
      setProfile({ ...profile, fileUrl: newUrl });
    }
  };

  const value = {
    profile,
    setProfile,
    updateAvatarUrl,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// 5. Create a custom Hook for easy access
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};