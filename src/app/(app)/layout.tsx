
'use client';

import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { AppShell } from "@/components/app/app-shell";
import { useUser } from "@/firebase/auth/use-user";
import { useFirestore } from "@/firebase";
import { doc, type DocumentData } from 'firebase/firestore';
import { useDoc } from "@/firebase/firestore/use-doc";
import { UserProfileProvider } from "@/contexts/user-profile-context";

/**
 * Este layout ahora es mucho más simple. Asume que ya está siendo renderizado
 * dentro de los proveedores del lado del cliente (gracias a ClientGate).
 * Su única responsabilidad es obtener los datos del perfil y configurar el AppShell.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading: loadingUser } = useUser();
  const firestore = useFirestore();

  const userProfileQuery = useMemo(() => {
    if (firestore && user?.uid) {
      return doc(firestore, "users", user.uid);
    }
    return null;
  }, [firestore, user?.uid]);

  const { data: userProfile, isLoading: loadingProfile } = useDoc<DocumentData>(userProfileQuery);

  const isLoading = loadingUser || (!!user && loadingProfile);

  return (
    <UserProfileProvider userProfile={userProfile} loadingProfile={isLoading}>
      <AppShell userProfile={userProfile} isLoading={isLoading}>
        {children}
      </AppShell>
    </UserProfileProvider>
  );
}
