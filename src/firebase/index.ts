'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// --- Instancias de Firebase cacheadas ---
let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

/**
 * Inicializa la aplicación Firebase y los SDKs del cliente de forma idempotente.
 */
function initializeFirebaseClient(): { firebaseApp: FirebaseApp | null, auth: Auth | null, firestore: Firestore | null } {
  // Si ya se inicializó, retornar las instancias existentes
  if (firebaseApp) {
    return { firebaseApp, auth, firestore };
  }

  // Si estamos en un entorno de servidor (como el build de Vercel) y no hay config,
  // no inicializamos para permitir que el build pase.
  if (typeof window === 'undefined' && (!firebaseConfig.apiKey || !firebaseConfig.projectId)) {
    console.warn('⚠️ Advertencia: Variables de entorno de Firebase no encontradas en el entorno de servidor. Saltando inicialización para el build.');
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // Validar que la configuración existe en el cliente
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Error: Configuración de Firebase incompleta. Revisa tus variables de entorno NEXT_PUBLIC_*.');
    // En lugar de lanzar un error, devolvemos null para que la app no crashee.
    // Los hooks se encargarán de manejar el estado nulo.
    return { firebaseApp: null, auth: null, firestore: null };
  }

  // Inicializar solo si no existe
  if (getApps().length === 0) {
    console.log('🔥 Inicializando Firebase con projectId:', firebaseConfig.projectId);
    const app = initializeApp(firebaseConfig);
    firebaseApp = app;
    auth = getAuth(app);
    firestore = getFirestore(app);
  } else {
    const app = getApp();
    firebaseApp = app;
    auth = getAuth(app);
    firestore = getFirestore(app);
  }
  
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
