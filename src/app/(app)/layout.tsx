
'use client';

import type { ReactNode } from "react";
import React, { useState, useEffect, useMemo } from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppShell } from "@/components/app/app-shell";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { UserProfileProvider } from "@/contexts/user-profile-context";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname } from "next/navigation";
import { ThemeProvider } from 'next-themes';

function InnerAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: loadingUser } = useUser();
  const firestore = useFirestore();

  // Memoize the user profile query to prevent re-renders
  const userProfileQuery = useMemo(() => {
    // Only create the query if we have a user
    if (firestore && user?.uid) {
      return doc(firestore, "users", user.uid);
    }
    return null;
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: loadingProfile, error } = useDoc<DocumentData>(userProfileQuery);
  
  if (error) {
    console.error("Error loading user profile:", error);
  }

  const isLoading = loadingUser || (!!user && loadingProfile);

  return (
    <UserProfileProvider userProfile={userProfile} loadingProfile={isLoading}>
      <AppShell userProfile={userProfile} isLoading={isLoading}>
        {children}
      </AppShell>
    </UserProfileProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // When the component mounts on the client, we set the state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration errors by not rendering the main content on the server.
  // The user hook will handle redirection if necessary.
  if (!mounted) {
    // This skeleton structure MUST be identical to the one rendered by AppShell
    return (
       <div className="min-h-screen bg-gray-50 flex">
          <aside
            className="hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 w-64"
          >
            <div className="flex flex-col w-full h-full p-4">
              <Skeleton className="h-full w-full" />
            </div>
          </aside>
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 md:hidden flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-white px-4 z-30"></header>
            <main className="flex-1 p-4 lg:gap-6 lg:p-6 overflow-y-auto">
              <Skeleton className="h-full w-full" />
            </main>
          </div>
        </div>
    );
  }
  
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FirebaseClientProvider>
            <InnerAppLayout>
              {children}
            </InnerAppLayout>
        </FirebaseClientProvider>
    </ThemeProvider>
  );
}
