'use server';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Tipado para los datos de entrada
interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  role: 'STUDENT' | 'TEACHER' | 'SUPER_ADMIN';
  groupId: string | null;
}

export async function createUser(data: CreateUserInput) {
  const { email, password, displayName, role, groupId } = data;

  try {
    // 1. Crear el usuario en Authentication
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Establecer Custom Claims (El rol dentro del token JWT)
    await adminAuth.setCustomUserClaims(userRecord.uid, { role });

    // 3. Crear el documento en Firestore
    const userProfileData = {
      uid: userRecord.uid,
      email,
      displayName,
      role,
      groupId: role === 'STUDENT' && groupId ? groupId : null,
      managedGroupIds: role === 'TEACHER' ? [] : null,
      status: 'offline', // Estado inicial
      lastSeen: Timestamp.now(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userProfileData);

    return { success: true, uid: userRecord.uid };
    
  } catch (error: any) {
    console.error("Error en la creación del usuario:", error);
    
    if (error.code === 'auth/email-already-exists') {
        throw new Error('El correo electrónico ya está en uso por otra cuenta.');
    }
    
    // Lanza un nuevo error con un mensaje más genérico o el específico de Firebase
    throw new Error(error.message || 'Ocurrió un error al crear el usuario en el servidor.');
  }
}
