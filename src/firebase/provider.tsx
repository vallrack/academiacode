'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { useUser as useAuthUserHook } from './auth/use-user'; 
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { firebaseApp, auth, firestore } from '@/firebase'; // Importar instancias

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const contextValue = useMemo(() => ({
    firebaseApp,
    auth,
    firestore,
  }), []);

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
    throw new Error('useFirebaseContext debe ser usado dentro de un FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp(): FirebaseApp {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) {
    throw new Error('La app de Firebase no está disponible.');
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

// Memoization Hook
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  const memoized = React.useMemo(factory, deps);
  
  if(typeof memoized === 'object' && memoized !== null) {
    // Adjuntar una propiedad para la verificación. Es un hack, pero funciona para este caso de uso.
    (memoized as T & { __memo?: boolean }).__memo = true;
  }
  
  return memoized;
}