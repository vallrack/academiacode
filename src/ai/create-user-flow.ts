'use server';
/**
 * @fileOverview A Genkit flow for securely creating Firebase users.
 *
 * This flow uses the Firebase Admin SDK to create a new user with email/password
 * and sets their custom claims and Firestore profile document. This should be
 * called by an authenticated admin/teacher from the client-side.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string(),
  role: z.enum(['STUDENT', 'TEACHER', 'SUPER_ADMIN']),
  groupId: z.string().optional().nullable(),
});
type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string(),
  email: z.string(),
  displayName: z.string(),
});
type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;


// Exported wrapper function to be called from the client
export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}


const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
    auth: (auth, input) => {
        // Here you would implement your authorization logic.
        // For now, we'll just check if the user is authenticated.
        // In a real app, you'd check if auth.uid has 'admin' or 'teacher' role.
        if (!auth) {
            throw new Error('Authorization failed: User is not authenticated.');
        }
    }
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
        // Only include groupId if the role is STUDENT and it's provided
        groupId: role === 'STUDENT' && groupId ? groupId : null,
      };

      await getFirestore().collection('users').doc(userRecord.uid).set(userProfileData);

      return {
        uid: userRecord.uid,
        email: userRecord.email!,
        displayName: userRecord.displayName!,
      };

    } catch (error: any) {
      // Log the detailed error on the server
      console.error("Error in createUserFlow: ", error);
      
      // Throw a more generic error to the client
      throw new Error(`Failed to create user. Code: ${error.code}`);
    }
  }
);
