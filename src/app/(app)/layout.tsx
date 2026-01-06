'use client';

import type { ReactNode } from "react";
import React from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppShell } from "@/components/app/app-shell";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { UserProfileProvider } from "@/contexts/user-profile-context";

function InnerAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: loadingUser } = useUser();
  const firestore = useFirestore();

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: loadingProfile, error } = useDoc<DocumentData>(userProfileQuery);
  
  if (error) {
    console.error("Error loading user profile:", error);
  }

  const isLoading = loadingUser || loadingProfile;

  return (
    <UserProfileProvider userProfile={userProfile} loadingProfile={isLoading}>
      <AppShell userProfile={userProfile} isLoading={isLoading}>
        {children}
      </AppShell>
    </UserProfileProvider>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <InnerAppLayout>
        {children}
      </InnerAppLayout>
    </FirebaseClientProvider>
  );
}
