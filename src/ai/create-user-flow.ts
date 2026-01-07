'use server';
/**
 * @fileOverview A Genkit flow for securely creating Firebase users.
 *
 * This flow uses the Firebase Admin SDK to create a new user with email/password,
 * set a custom role claim on their auth token, and create their Firestore profile document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not found. Falling back to applicationDefault(). For local development, ensure you are authenticated via 'gcloud auth application-default login'.");
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } catch (e: any) {
    console.error("Firebase Admin SDK initialization failed:", e);
    // Propagate a more informative error to the client if initialization fails.
    throw new Error(`Server configuration error: Could not initialize Firebase Admin SDK. ${e.message}`);
  }
}


// Internal schemas and types - NOT exported
const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string(),
  role: z.enum(['STUDENT', 'TEACHER', 'SUPER_ADMIN']),
  groupId: z.string().optional().nullable(),
});

const CreateUserOutputSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
  role: z.string(),
});

// Define the flow
const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    const { email, password, displayName, role, groupId } = input;

    try {
      // 1. Create user in Firebase Auth
      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName,
      });

      // 2. Set custom claim for the user's role
      await getAuth().setCustomUserClaims(userRecord.uid, { role });

      // 3. Create user profile in Firestore
      const userProfileData: any = {
        uid: userRecord.uid,
        email,
        displayName,
        role,
        // Assign groupId only if the role is STUDENT
        groupId: role === 'STUDENT' && groupId ? groupId : null,
        // Initialize managedGroupIds for TEACHER, otherwise null
        managedGroupIds: role === 'TEACHER' ? [] : null,
      };

      await getFirestore().collection('users').doc(userRecord.uid).set(userProfileData);

      return {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
        role: role,
      };

    } catch (error: any) {
      console.error("Error in createUserFlow: ", error);
      // Check for a specific auth error code for better messages
      if (error.code === 'auth/email-already-exists') {
          throw new Error('El correo electrónico ya está en uso por otra cuenta.');
      }
      throw new Error(`Failed to create user. ${error.message || 'Unknown error'}`);
    }
  }
);

// ONLY export the async function wrapper
export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
  role: "STUDENT" | "TEACHER" | "SUPER_ADMIN";
  groupId?: string | null;
}) {
  return createUserFlow(input);
}
