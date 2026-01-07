'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANTE: NO MODIFICAR ESTA FUNCIÓN
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }
  
  // Verifica que todas las claves de configuración necesarias estén presentes
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
     console.error(
      'Firebase config is missing in src/firebase/config.ts'
    );
    // Retornamos un objeto con los servicios como null para evitar que la app crashee
    // Los hooks como useFirebase se encargarán de manejar este estado.
    return { firebaseApp: null, auth: null, firestore: null };
  }

  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
