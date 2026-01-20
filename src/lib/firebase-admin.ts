// @/lib/firebase-admin.ts
import * as admin from 'firebase-admin';

// This pattern ensures the SDK is initialized only once.
if (!admin.apps.length) {
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Vercel and other platforms often escape newlines. We need to un-escape them.
    const privateKey = (serviceAccount.private_key || '').replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        private_key: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin SDK inicializado correctamente.');

  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error(
        '❌ CRITICAL: Error de sintaxis en la clave de servicio de Firebase. ' +
        'Revisa la variable en Vercel y asegúrate de que no esté envuelta en comillas adicionales (`"`) al principio o al final. ' +
        'El valor debe empezar con `{` y terminar con `}`.'
      );
    }
    console.error('❌ CRITICAL: Falla en la inicialización de Firebase Admin SDK.', error.message);
    // We don't re-throw here to allow the build to complete, but subsequent calls will fail.
  }
}

// Export initialized services directly.
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export { admin }; // Keep the namespace export for flexibility.
