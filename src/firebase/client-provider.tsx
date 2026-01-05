'use client';

import type { ReactNode } from 'react';
import { initializeFirebase } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

// IMPORTANT: Do not add any logic before this point.
// This is the single source of truth for Firebase initialization.
const firebase = initializeFirebase();

/**
 * Provides the Firebase app, Firestore, and Auth instances to the client-side of the application.
 *
 * This provider should be used at the root of the application to ensure that
 * Firebase is initialized only once.
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  return <FirebaseProvider {...firebase}>{children}</FirebaseProvider>;
}
