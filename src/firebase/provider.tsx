
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { useUser as useAuthUserHook } from './auth/use-user'; 
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// Singleton instances
let app: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

function initializeFirebase() {
  if (typeof window !== 'undefined' && !getApps().length) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error("Firebase config variables are not defined. Check your environment variables.");
    }
    
    app = initializeApp(firebaseConfig);
    
    // Initialize Firestore with robust persistence settings
    try {
        firestore = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager()
            })
        });
    } catch(e) {
        console.warn('Could not initialize persistent cache, falling back to default. Error:', e);
        firestore = getFirestore(app);
    }
    
    auth = getAuth(app);
    console.log('✅ Firebase initialized with persistent cache.');

  } else if (typeof window !== 'undefined') {
    app = getApp();
    firestore = getFirestore(app);
    auth = getAuth(app);
  }
}

// Initialize on module load
initializeFirebase();

export function FirebaseProvider({ children }: { children: ReactNode }) {
  // The context value is now stable as it's based on module-level singletons
  if (!app || !firestore || !auth) {
    // This can happen during server-side rendering, return null or a loader
    return null; 
  }

  const contextValue = { firebaseApp: app, firestore, auth };

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

function useFirebaseContext() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseContext must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp(): FirebaseApp {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) {
    throw new Error('La app de Firebase no está disponible. Revisa tu configuración.');
  }
  return firebaseApp;
}

export function useAuth(): Auth {
  const { auth } = useFirebaseContext();
  if (!auth) {
    throw new Error('El servicio de autenticación de Firebase no está disponible.');
  }
  return auth;
}

export function useFirestore(): Firestore {
  const { firestore } = useFirebaseContext();
  if (!firestore) {
    throw new Error('El servicio de Firestore no está disponible.');
  }
  return firestore;
}

export function useUser() {
    return useAuthUserHook();
}
