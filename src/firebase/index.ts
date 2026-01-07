'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// --- Instancias de Firebase cacheadas ---
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Inicializa la aplicación Firebase y los SDKs del cliente de forma idempotente.
 */
function initializeFirebaseClient() {
  // Validar que la configuración existe
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Error: Configuración de Firebase incompleta');
    console.log('Config actual:', firebaseConfig);
    // En lugar de lanzar un error que detenga la app, asignamos instancias "dummy"
    // para que la app no crashee en el servidor o durante el build.
    // @ts-ignore
    firebaseApp = { appName: 'dummy', options: {} };
    // @ts-ignore
    auth = { currentUser: null };
    // @ts-ignore
    firestore = { type: 'dummy-firestore' };
    return { firebaseApp, auth, firestore };
  }

  // Inicializar solo si no existe
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

// Inicializamos inmediatamente para que las instancias estén disponibles para exportación.
initializeFirebaseClient();


// Exportaciones directas
export { firebaseApp, auth, firestore };

// --- Exports de Hooks y Providers ---
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
