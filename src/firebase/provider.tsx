
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

function createFirebaseServices() {
    if (typeof window === 'undefined') {
        return { app: null, firestore: null, auth: null };
    }

    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        throw new Error("Las variables de configuración de Firebase no están definidas. Revisa tus variables de entorno.");
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    let firestore: Firestore;
    try {
        firestore = initializeFirestore(app, {
            localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
        });
    } catch (error: any) {
        if (error.code === 'failed-precondition') {
            console.warn('La persistencia de Firestore ya está habilitada en otra pestaña.');
        } else {
            console.error('Error al inicializar Firestore con persistencia:', error);
        }
        firestore = getFirestore(app);
    }
    
    const auth = getAuth(app);

    return { app, firestore, auth };
}

const { app, firestore, auth } = createFirebaseServices();

export function FirebaseProvider({ children }: { children: ReactNode }) {
  if (!app || !firestore || !auth) {
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
    throw new Error('useFirebaseContext debe ser usado dentro de un FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp(): FirebaseApp {
  const { firebaseApp } = useFirebaseContext();
  return firebaseApp;
}

export function useAuth(): Auth {
  const { auth } = useFirebaseContext();
  return auth;
}

export function useFirestore(): Firestore {
  const { firestore } = useFirebaseContext();
  return firestore;
}

export function useUser() {
    return useAuthUserHook();
}
