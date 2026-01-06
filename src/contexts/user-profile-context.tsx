'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import type { DocumentData } from 'firebase/firestore';

interface UserProfileContextType {
  userProfile: DocumentData | null | undefined;
  loadingProfile: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ 
  children, 
  userProfile, 
  loadingProfile 
}: { 
  children: ReactNode; 
  userProfile: DocumentData | null | undefined; 
  loadingProfile: boolean;
}) {
  return (
    <UserProfileContext.Provider value={{ userProfile, loadingProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
