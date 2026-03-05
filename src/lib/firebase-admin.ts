
import * as admin from 'firebase-admin';

function initializeAdminApp() {
    // Si la app ya está inicializada (por el hot-reloading), la reutilizamos.
    if (admin.apps.length > 0) {
        return admin.app();
    }

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            console.warn("Firebase Admin SDK no se inicializó: falta la variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY.");
            return null;
        }

        const serviceAccount = JSON.parse(serviceAccountKey);
        const privateKey = (serviceAccount.private_key || '').replace(/\\n/g, '\n');

        const app = admin.initializeApp({
            credential: admin.credential.cert({
                ...serviceAccount,
                private_key: privateKey,
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });

        console.log('✅ Firebase Admin SDK inicializado correctamente.');
        return app;

    } catch (error: any) {
        if (error instanceof SyntaxError) {
            console.error(
              '❌ CRITICAL: Error de sintaxis en la clave de servicio de Firebase. ' +
              'Asegúrate de que el JSON es válido y no está envuelto en comillas extra.'
            );
        }
        console.error('❌ CRITICAL: Falla en la inicialización de Firebase Admin SDK.', error.message);
        return null;
    }
}

const app = initializeAdminApp();

export const adminAuth = app ? app.auth() : null;
export const adminDb = app ? app.firestore() : null;
export const adminStorage = app ? app.storage() : null;
export { admin };
