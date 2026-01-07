// @/lib/firebase-admin.ts
// IMPORTANTE: ELIMINA EL 'use server' DE AQUÍ

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccount,
        // Corrige los saltos de línea para que la llave privada funcione en producción
        privateKey: serviceAccount.privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin SDK inicializado correctamente.");
  } catch (e: any) {
    console.error("Error al inicializar Firebase Admin SDK:", e.message);
    // En un entorno de producción, podrías querer manejar esto de forma más robusta.
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
