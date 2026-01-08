// @/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let isInitialized = false;

function initializeFirebaseAdmin() {
  // Skip durante build si no hay variables de entorno.
  // Vercel setea esta variable automáticamente.
  if (process.env.VERCEL && !process.env.FIREBASE_PROJECT_ID) {
      console.log('⏭️ Skipping Firebase Admin initialization during build (no env vars found).');
      return;
  }
    
  if (isInitialized || admin.apps.length > 0) {
    isInitialized = true;
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
       // No lanzar error durante el build, solo advertir.
       if (process.env.NODE_ENV === 'production') {
         console.warn('⚠️ Firebase Admin environment variables are not defined. Skipping initialization.');
         return;
       }
      throw new Error(
        '❌ Las variables de entorno para Firebase Admin (FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL) no están definidas.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Reemplaza los saltos de línea literales para que la llave sea válida
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    isInitialized = true;
    console.log('✅ Firebase Admin SDK inicializado correctamente');
    console.log('📁 Project ID:', projectId);
    
  } catch (error: any) {
    console.error('❌ Error al inicializar Firebase Admin SDK:', error.message);
    // No re-lanzar error durante el build para permitir que se complete.
    if (process.env.NODE_ENV !== 'production') {
        throw error;
    }
  }
}

// Inicializar inmediatamente cuando se importe este módulo
initializeFirebaseAdmin();

/**
 * Obtiene la instancia de Auth con validación
 */
function getAdminAuth() {
  if (!isInitialized) {
    // Durante el build, esto puede fallar. Devolvemos un objeto nulo para que no se rompa el build.
    if (process.env.NODE_ENV === 'production') {
        return null as any;
    }
    throw new Error('Firebase Admin no está inicializado. Revisa tus variables de entorno.');
  }
  return admin.auth();
}

/**
 * Obtiene la instancia de Firestore con validación
 */
function getAdminDb() {
  if (!isInitialized) {
     if (process.env.NODE_ENV === 'production') {
        return null as any;
    }
    throw new Error('Firebase Admin no está inicializado. Revisa tus variables de entorno.');
  }
  return admin.firestore();
}

// Exportar las funciones getter
export const adminAuth = getAdminAuth();
export const adminDb = getAdminDb();

// Exportar admin por si se necesita acceso directo
export { admin };
