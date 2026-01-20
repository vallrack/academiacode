// Es crucial que estas variables de entorno se configuren tanto en tu archivo .env.local como en tu proveedor de hosting (ej. Vercel).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validación opcional para desarrollo
if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey) {
    console.error('❌ FIREBASE CONFIG ERROR: Las variables de entorno no están configuradas');
    console.log('Variables actuales:', firebaseConfig);
  } else {
    console.log('✅ Firebase config cargada correctamente');
  }
}
