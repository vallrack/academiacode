'use server';
/**
 * @fileOverview A Genkit flow for securely creating Firebase users.
 *
 * This flow uses the Firebase Admin SDK to create a new user with email/password
 * and sets their custom claims and Firestore profile document.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

      // 2. Set custom claims for role-based access control
      await getAuth().setCustomUserClaims(userRecord.uid, { role });

      // 3. Create user profile in Firestore
      const userProfileData: any = {
        uid: userRecord.uid,
        email,
        displayName,
        role,
        groupId: role === 'STUDENT' && groupId ? groupId : null,
      };

      await getFirestore().collection('users').doc(userRecord.uid).set(userProfileData);

      return {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
      };

    } catch (error: any) {
      console.error("Error in createUserFlow: ", error);
      throw new Error(`Failed to create user. ${error.message || error.code || 'Unknown error'}`);
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
