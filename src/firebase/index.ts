import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from '@/firebase/config';

// Re-export the providers and hooks
export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from '@/firebase/provider';
export { FirebaseClientProvider } from '@/firebase/client-provider';
export { useCollection } from '@/firebase/firestore/use-collection';
export { useDoc } from '@/firebase/firestore/use-doc';
export { useUser } from '@/firebase/auth/use-user';


export type FirebaseInstances = {
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
};

/**
 * Initializes Firebase and returns the app, Firestore, and Auth instances.
 *
 * This function is idempotent and will only initialize Firebase once.
 */
export function initializeFirebase(): FirebaseInstances {
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);

  const firestore = getFirestore(app);
  const auth = getAuth(app);

  return { app, firestore, auth };
}
