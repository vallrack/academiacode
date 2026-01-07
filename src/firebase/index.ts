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
 * Evita la reinicialización en el lado del cliente (HMR).
 * @returns Un objeto que contiene las instancias de los servicios de Firebase.
 */
function initializeFirebaseClient() {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("AIza")) {
       console.log(
        'La configuración de Firebase está ausente o es un marcador de posición en src/firebase/config.ts. Usando configuración dummy.'
      );
      // Retornar stubs para evitar que la app crashee en el servidor o durante el build.
      // @ts-ignore
      firebaseApp = { appName: 'dummy', options: {} };
      // @ts-ignore
      auth = { currentUser: null };
      // @ts-ignore
      firestore = { type: 'dummy-firestore' };
      return { firebaseApp, auth, firestore };
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
