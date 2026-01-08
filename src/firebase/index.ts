'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebaseClient() {
  // CAMBIO: No validar en build time, solo en runtime
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    // En el servidor (build time), retornar stubs
    console.log('⏭️ Skipping Firebase initialization during build');
    // @ts-ignore - stubs para build
    firebaseApp = { name: '[DEFAULT]' };
    // @ts-ignore
    auth = {};
    // @ts-ignore
    firestore = {};
    return { firebaseApp, auth, firestore };
  }

  // Validar solo en el cliente (browser)
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Error: Configuración de Firebase incompleta');
    console.log('Config actual:', firebaseConfig);
    throw new Error(
      'Firebase no está configurado correctamente. Verifica tus variables de entorno NEXT_PUBLIC_*'
    );
  }

  if (getApps().length === 0) {
    console.log('🔥 Inicializando Firebase con projectId:', firebaseConfig.projectId);
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, firestore };
}

// Inicializar
initializeFirebaseClient();

export { firebaseApp, auth, firestore };

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';