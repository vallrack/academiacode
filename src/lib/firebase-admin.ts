// @/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

let isInitialized = false;

/**
 * Inicializa Firebase Admin SDK de forma segura
 */
function initializeFirebaseAdmin() {
  // Si ya está inicializado, no hacer nada
  if (isInitialized || admin.apps.length > 0) {
    isInitialized = true;
    return;
  }

  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountString) {
      throw new Error(
        '❌ FIREBASE_SERVICE_ACCOUNT_KEY no está definida en las variables de entorno'
      );
    }

    // Validar que es un JSON válido
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (parseError) {
      throw new Error(
        '❌ FIREBASE_SERVICE_ACCOUNT_KEY no es un JSON válido. Verifica que copiaste correctamente la clave.'
      );
    }

    // Validar campos requeridos
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error(
        '❌ La service account key está incompleta. Debe tener project_id, private_key y client_email'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });

    isInitialized = true;
    console.log('✅ Firebase Admin SDK inicializado correctamente');
    console.log('📁 Project ID:', serviceAccount.project_id);
    
  } catch (error: any) {
    console.error('❌ Error al inicializar Firebase Admin SDK:', error.message);
    // Re-lanzar el error para que falle rápido y sea obvio
    throw error;
  }
}

// Inicializar inmediatamente cuando se importe este módulo
initializeFirebaseAdmin();

/**
 * Obtiene la instancia de Auth con validación
 */
function getAdminAuth() {
  if (!isInitialized) {
    throw new Error('Firebase Admin no está inicializado. Revisa tus variables de entorno.');
  }
  return admin.auth();
}

/**
 * Obtiene la instancia de Firestore con validación
 */
function getAdminDb() {
  if (!isInitialized) {
    throw new Error('Firebase Admin no está inicializado. Revisa tus variables de entorno.');
  }
  return admin.firestore();
}

// Exportar las funciones getter
export const adminAuth = getAdminAuth();
export const adminDb = getAdminDb();

// Exportar admin por si se necesita acceso directo
export { admin };