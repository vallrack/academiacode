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
        projectId: serviceAccount.project_id, // Usa project_id (con guion bajo)
        clientEmail: serviceAccount.client_email, // Usa client_email
        // Reemplaza los saltos de línea literales para que la llave sea válida
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin inicializado correctamente con el proyecto academiacode-f42d8.");
  } catch (e: any) {
    console.error("Error al inicializar Firebase Admin:", e.message);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
