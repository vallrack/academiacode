'use client';

import type { ReactNode } from "react";
import React from "react";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AppShell } from "@/components/app/app-shell";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore, useMemoFirebase } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";

function InnerAppLayout({ children }: { children: ReactNode }) {
  const { user, loading: loadingUser } = useUser();
  const firestore = useFirestore();

  // CORRECTO: Usar useDoc para obtener un único documento (operación 'get')
  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: loadingProfile, error } = useDoc<DocumentData>(userProfileQuery);
  
  if (error) {
    console.error("Error loading user profile:", error);
    // Opcionalmente, renderizar un estado de error o redirigir a login
  }

  const isLoading = loadingUser || loadingProfile;

  return (
    <AppShell userProfile={userProfile} isLoading={isLoading}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            // @ts-expect-error - inyectando props
            return React.cloneElement(child, { userProfile, loadingProfile: isLoading });
          }
          return child;
        })}
    </AppShell>
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
