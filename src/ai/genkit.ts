'use server';

import {genkit, Ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  // Use service account credentials if available, otherwise fall back to application default.
  // This is more robust for local development and production environments.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This will work in managed Google Cloud environments.
    // For local dev, you might need to run `gcloud auth application-default login`.
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Falling back to applicationDefault(). For local development, ensure you are authenticated via 'gcloud auth application-default login'.");
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
}


export const ai: Ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
