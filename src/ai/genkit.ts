'use client';

import {genkit, Ai} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const ai: Ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
