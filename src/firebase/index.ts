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
 * Inicializa la aplicación Firebase y los SDKs del cliente.
 * Evita la reinicialización en el lado del cliente (HMR).
 * 
 * @returns Un objeto que contiene las instancias de los servicios de Firebase.
 */
function initializeFirebaseClient() {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("REEMPLAZA")) {
      console.error(
        'La configuración de Firebase está ausente o incompleta en src/firebase/config.ts. Reemplaza los valores de marcador de posición.'
      );
      // Retornar stubs para evitar que la app crashee en el servidor o durante el build.
      return { firebaseApp: null, auth: null, firestore: null };
    }
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

// Exportaciones directas de las instancias para usar en la app.
export { firebaseApp, auth, firestore };


// --- Exports de Hooks y Providers ---
// Estos componentes y hooks utilizan las instancias ya inicializadas.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';